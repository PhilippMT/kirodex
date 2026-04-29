import { memo, useEffect, useMemo, useState } from 'react'
import { IconExternalLink, IconFileCode, IconPlug, IconPlus, IconTrash } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ipc } from '@/lib/ipc'
import { cn } from '@/lib/utils'
import type { KiroMcpServer } from '@/types'
import type { ViewerState } from './kiro-config-helpers'

type McpScope = 'global' | 'local'
type McpTransport = KiroMcpServer['transport']

interface McpFormState {
  name: string
  scope: McpScope
  enabled: boolean
  transport: McpTransport
  command: string
  args: string
  url: string
  env: string
  headers: string
  autoApprove: string
  disabledTools: string
}

interface McpManagerProps {
  open: boolean
  servers: KiroMcpServer[]
  activeWorkspace: string | null
  initialServer?: KiroMcpServer | null
  onClose: () => void
  onChanged: () => void
  onOpenJson: (viewer: ViewerState) => void
}

const EMPTY_FORM: McpFormState = {
  name: '',
  scope: 'local',
  enabled: true,
  transport: 'stdio',
  command: '',
  args: '',
  url: '',
  env: '',
  headers: '',
  autoApprove: '',
  disabledTools: '',
}

const mapToLines = (value?: Record<string, string>): string =>
  Object.entries(value ?? {}).map(([key, val]) => `${key}=${val}`).join('\n')

const listToLines = (value?: string[]): string => (value ?? []).join('\n')

const linesToList = (value: string): string[] =>
  value.split('\n').map((line) => line.trim()).filter(Boolean)

const linesToMap = (value: string): Record<string, string> | undefined => {
  const entries = value.split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf('=')
      return idx < 0 ? [line, ''] : [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]
    })
    .filter(([key]) => key)
  return entries.length ? Object.fromEntries(entries) : undefined
}

const serverToForm = (server: KiroMcpServer | null | undefined, activeWorkspace: string | null): McpFormState => {
  if (!server) {
    return { ...EMPTY_FORM, scope: activeWorkspace ? 'local' : 'global' }
  }
  return {
    name: server.name,
    scope: server.source,
    enabled: server.enabled,
    transport: server.transport,
    command: server.command ?? '',
    args: listToLines(server.args),
    url: server.url ?? '',
    env: mapToLines(server.env),
    headers: mapToLines(server.headers),
    autoApprove: listToLines(server.autoApprove),
    disabledTools: listToLines(server.disabledTools),
  }
}

const formToConfig = (form: McpFormState): Record<string, unknown> => {
  const config: Record<string, unknown> = { disabled: !form.enabled }
  const env = linesToMap(form.env)
  const autoApprove = linesToList(form.autoApprove)
  const disabledTools = linesToList(form.disabledTools)
  if (env) config.env = env
  if (autoApprove.length) config.autoApprove = autoApprove
  if (disabledTools.length) config.disabledTools = disabledTools
  if (form.transport === 'stdio') {
    config.command = form.command.trim()
    const args = linesToList(form.args)
    if (args.length) config.args = args
  } else {
    config.url = form.url.trim()
    if (form.transport !== 'http') config.transport = form.transport
    const headers = linesToMap(form.headers)
    if (headers) config.headers = headers
  }
  return config
}

const transportDescription: Record<McpTransport, string> = {
  stdio: 'Runs a local MCP server process. Command is required; args are available.',
  http: 'Connects to a remote HTTPS MCP endpoint or localhost HTTP endpoint.',
  sse: 'Connects to a remote SSE MCP endpoint. Command and args are disabled.',
  'streamable-http': 'Connects to a streamable HTTP MCP endpoint. Command and args are disabled.',
}

export const KiroMcpManager = memo(function KiroMcpManager({
  open,
  servers,
  activeWorkspace,
  initialServer,
  onClose,
  onChanged,
  onOpenJson,
}: McpManagerProps) {
  const [form, setForm] = useState<McpFormState>(() => serverToForm(initialServer, activeWorkspace))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paths, setPaths] = useState<{ globalPath: string; projectPath?: string } | null>(null)

  useEffect(() => {
    if (!open) return
    setForm(serverToForm(initialServer, activeWorkspace))
    setError(null)
    ipc.getMcpConfigPaths(activeWorkspace ?? undefined).then(setPaths).catch((err) => {
      console.warn('[mcp] failed to load config paths', err)
      setPaths(null)
    })
  }, [activeWorkspace, initialServer, open])

  const grouped = useMemo(() => ({
    local: servers.filter((server) => server.source === 'local'),
    global: servers.filter((server) => server.source === 'global'),
  }), [servers])

  const isRemote = form.transport !== 'stdio'
  const canSave = form.name.trim() && (isRemote ? form.url.trim() : form.command.trim())

  const handleSelectServer = (server: KiroMcpServer) => {
    setForm(serverToForm(server, activeWorkspace))
    setError(null)
  }

  const handleNew = (scope: McpScope) => {
    setForm({ ...EMPTY_FORM, scope })
    setError(null)
  }

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      await ipc.saveMcpServer(form.scope === 'local' ? activeWorkspace ?? undefined : undefined, form.name.trim(), formToConfig(form))
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await ipc.deleteMcpServer(form.scope === 'local' ? activeWorkspace ?? undefined : undefined, form.name.trim())
      onChanged()
      handleNew(activeWorkspace ? 'local' : 'global')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const handleOpenJson = (scope: McpScope) => {
    const filePath = scope === 'local' ? paths?.projectPath : paths?.globalPath
    if (!filePath) return
    onOpenJson({ filePath, title: scope === 'local' ? 'Project MCP JSON' : 'Global MCP JSON' })
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-4xl overflow-hidden p-0" showCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><IconPlug className="size-5" /> MCP servers</DialogTitle>
          <DialogDescription>
            Configure global and project MCP servers. Kiro loads agent, project, then global configuration by priority.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-[520px] grid-cols-[220px_1fr] overflow-hidden border-t border-border">
          <aside className="min-h-0 overflow-y-auto border-r border-border bg-muted/20 p-3">
            <div className="mb-3 flex gap-2">
              <Button type="button" size="xs" variant="outline" onClick={() => handleNew('global')}><IconPlus /> Global</Button>
              <Button type="button" size="xs" variant="outline" onClick={() => handleNew('local')} disabled={!activeWorkspace}><IconPlus /> Project</Button>
            </div>
            {(['local', 'global'] as McpScope[]).map((scope) => (
              <div key={scope} className="mb-4">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{scope === 'local' ? 'Project' : 'Global'}</p>
                  <button
                    type="button"
                    onClick={() => handleOpenJson(scope)}
                    disabled={scope === 'local' && !paths?.projectPath}
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
                  >
                    <IconFileCode className="size-3" /> JSON
                  </button>
                </div>
                <div className="space-y-1">
                  {grouped[scope].map((server) => (
                    <button
                      key={`${server.source}-${server.name}`}
                      type="button"
                      onClick={() => handleSelectServer(server)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent',
                        form.name === server.name && form.scope === server.source && 'bg-accent text-foreground',
                      )}
                    >
                      <span className="truncate">{server.name}</span>
                      <span className="text-[10px] text-muted-foreground">{server.transport}</span>
                    </button>
                  ))}
                  {grouped[scope].length === 0 && <p className="px-2 py-1 text-[11px] text-muted-foreground">No servers</p>}
                </div>
              </div>
            ))}
          </aside>

          <div className="min-h-0 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-xs font-medium">
                Name
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="github" />
              </label>
              <label className="space-y-1 text-xs font-medium">
                Scope
                <select
                  value={form.scope}
                  onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value as McpScope }))}
                  className="h-8 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="global">Global (~/.kiro/settings/mcp.json)</option>
                  <option value="local" disabled={!activeWorkspace}>Project (.kiro/settings/mcp.json)</option>
                </select>
              </label>
              <label className="space-y-1 text-xs font-medium">
                Transport
                <select
                  value={form.transport}
                  onChange={(e) => setForm((f) => ({ ...f, transport: e.target.value as McpTransport }))}
                  className="h-8 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="stdio">stdio / local command</option>
                  <option value="http">HTTP</option>
                  <option value="sse">SSE</option>
                  <option value="streamable-http">Streamable HTTP</option>
                </select>
                <span className="block text-[10px] font-normal text-muted-foreground">{transportDescription[form.transport]}</span>
              </label>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div>
                  <p className="text-xs font-medium">Enabled</p>
                  <p className="text-[10px] text-muted-foreground">Writes the Kiro `disabled` flag.</p>
                </div>
                <Switch checked={form.enabled} onCheckedChange={(checked) => setForm((f) => ({ ...f, enabled: checked }))} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className={cn('space-y-1 text-xs font-medium', isRemote && 'opacity-45')}>
                Command
                <Input disabled={isRemote} value={form.command} onChange={(e) => setForm((f) => ({ ...f, command: e.target.value }))} placeholder="uvx" />
              </label>
              <label className={cn('space-y-1 text-xs font-medium', isRemote && 'opacity-45')}>
                Args
                <Textarea disabled={isRemote} value={form.args} onChange={(e) => setForm((f) => ({ ...f, args: e.target.value }))} placeholder={'mcp-server-fetch\n--option'} className="min-h-24" />
              </label>
              <label className={cn('space-y-1 text-xs font-medium', !isRemote && 'opacity-45')}>
                URL
                <Input disabled={!isRemote} value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://api.example.com/mcp" />
              </label>
              <label className={cn('space-y-1 text-xs font-medium', !isRemote && 'opacity-45')}>
                Headers
                <Textarea disabled={!isRemote} value={form.headers} onChange={(e) => setForm((f) => ({ ...f, headers: e.target.value }))} placeholder="Authorization=Bearer ${TOKEN}" className="min-h-24" />
              </label>
              <label className="space-y-1 text-xs font-medium">
                Environment
                <Textarea value={form.env} onChange={(e) => setForm((f) => ({ ...f, env: e.target.value }))} placeholder="API_KEY=${API_KEY}" className="min-h-24" />
              </label>
              <div className="grid gap-3">
                <label className="space-y-1 text-xs font-medium">
                  Auto-approve tools
                  <Textarea value={form.autoApprove} onChange={(e) => setForm((f) => ({ ...f, autoApprove: e.target.value }))} placeholder="read_resource" className="min-h-20" />
                </label>
                <label className="space-y-1 text-xs font-medium">
                  Disabled tools
                  <Textarea value={form.disabledTools} onChange={(e) => setForm((f) => ({ ...f, disabledTools: e.target.value }))} placeholder="delete_file" className="min-h-20" />
                </label>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3 text-[11px] leading-relaxed text-muted-foreground">
              Use environment variables such as <code className="font-mono">${'{API_TOKEN}'}</code> for secrets. Remote servers should use HTTPS unless they are localhost. Tool Search is configured in Kiro CLI settings (<code className="font-mono">toolSearch.*</code>) and activates after MCP tools connect.
            </div>
            {error && <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="destructive-outline" onClick={handleDelete} disabled={saving || !form.name.trim()}><IconTrash /> Delete</Button>
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
          <Button type="button" onClick={handleSave} disabled={saving || !canSave}>Save server</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
