import { memo, useCallback, useState } from 'react'
import { IconArrowRight, IconX } from '@tabler/icons-react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useTaskStore } from '@/stores/taskStore'
import { ipc } from '@/lib/ipc'

const COMPACT_SUGGEST_THRESHOLD = 30
const HANDOFF_MESSAGE = 'Go ahead working on the plan'

interface CompactSuggestBannerProps {
  contextUsage: { used: number; size: number } | null | undefined
  isPlanMode: boolean
}

export const CompactSuggestBanner = memo(function CompactSuggestBanner({
  contextUsage,
  isPlanMode,
}: CompactSuggestBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)

  const handleDismiss = useCallback(() => setIsDismissed(true), [])

  const handleStartBuilding = useCallback(() => {
    const taskId = useTaskStore.getState().selectedTaskId
    if (!taskId || isSwitching) return
    setIsSwitching(true)
    useSettingsStore.setState({ currentModeId: 'kiro_default' })
    useTaskStore.getState().setTaskMode(taskId, 'kiro_default')
    ipc.setMode(taskId, 'kiro_default').then(() => {
      const state = useTaskStore.getState()
      const task = state.tasks[taskId]
      if (!task) return
      const userMsg = { role: 'user' as const, content: HANDOFF_MESSAGE, timestamp: new Date().toISOString() }
      state.upsertTask({ ...task, status: 'running', messages: [...task.messages, userMsg] })
      state.clearTurn(taskId)
      ipc.sendMessage(taskId, HANDOFF_MESSAGE)
    }).catch(() => setIsSwitching(false))
  }, [isSwitching])

  if (!isPlanMode || isDismissed) return null
  if (!contextUsage || contextUsage.size === 0) return null

  const pct = Math.round((contextUsage.used / contextUsage.size) * 100)
  if (pct < COMPACT_SUGGEST_THRESHOLD) return null

  return (
    <div
      data-testid="compact-suggest-banner"
      role="status"
      className="mx-4 mb-1.5 sm:mx-6"
    >
      <div className="mx-auto w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl">
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/80 px-3 py-1.5 text-[11px] text-muted-foreground">
          <span className="size-1.5 shrink-0 rounded-full bg-amber-500/70" aria-hidden />
          <span className="min-w-0 flex-1">
            {pct}% context used — switch to implement to preserve room for coding
          </span>
          <button
            type="button"
            onClick={handleStartBuilding}
            disabled={isSwitching}
            aria-label="Start building from plan"
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 font-medium text-teal-600 transition-colors hover:bg-teal-500/10 disabled:opacity-50 dark:text-teal-400"
          >
            {isSwitching ? 'Switching...' : 'Start building'}
            {!isSwitching && <IconArrowRight className="size-3" aria-hidden />}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="shrink-0 rounded p-0.5 text-muted-foreground/40 transition-colors hover:text-muted-foreground"
          >
            <IconX className="size-3" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
})
