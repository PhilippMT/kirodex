import { memo, useState, useCallback } from 'react'
import { IconChevronDown, IconRestore, IconTrash } from '@tabler/icons-react'
import { useTaskStore } from '@/stores/taskStore'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const TWO_DAYS_MS = 48 * HOUR_MS

const formatTimeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(diff / HOUR_MS)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const formatTimeRemaining = (iso: string): string => {
  const remaining = TWO_DAYS_MS - (Date.now() - new Date(iso).getTime())
  if (remaining <= 0) return 'expiring'
  const days = Math.floor(remaining / DAY_MS)
  const hrs = Math.floor((remaining % DAY_MS) / HOUR_MS)
  if (days > 0) return `${days}d ${hrs}h left`
  return `${hrs}h left`
}

export const RecentlyDeleted = memo(function RecentlyDeleted() {
  const softDeleted = useTaskStore((s) => s.softDeleted)
  const restoreTask = useTaskStore((s) => s.restoreTask)
  const permanentlyDeleteTask = useTaskStore((s) => s.permanentlyDeleteTask)
  const [isExpanded, setIsExpanded] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const handleToggle = useCallback(() => setIsExpanded((v) => !v), [])

  const handleRestore = useCallback((id: string) => {
    restoreTask(id)
  }, [restoreTask])

  const handlePermanentDelete = useCallback((id: string) => {
    setConfirmId(id)
  }, [])

  const handleConfirmDelete = useCallback((id: string) => {
    permanentlyDeleteTask(id)
    setConfirmId(null)
  }, [permanentlyDeleteTask])

  const handleCancelDelete = useCallback(() => {
    setConfirmId(null)
  }, [])

  const entries = Object.entries(softDeleted)
  if (entries.length === 0) return null

  return (
    <div className="mt-1 border-t border-border/40 pt-1">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-label={`Recently deleted, ${entries.length} threads`}
        className="flex w-full items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60 transition-colors hover:text-muted-foreground"
      >
        <IconChevronDown
          className={cn('size-3 transition-transform', !isExpanded && '-rotate-90')}
        />
        Recently deleted ({entries.length})
      </button>
      {isExpanded && (
        <ul className="flex flex-col gap-0.5 px-1" role="list" aria-label="Recently deleted threads">
          {entries.map(([id, { task, deletedAt }]) => (
            <li key={id} className="group/deleted relative">
              {confirmId === id ? (
                <div className="flex items-center gap-1 rounded-lg bg-destructive/5 px-2 py-1.5">
                  <p className="flex-1 text-[11px] text-muted-foreground">Delete permanently?</p>
                  <button
                    type="button"
                    onClick={() => handleConfirmDelete(id)}
                    className="rounded-md bg-destructive/90 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-destructive transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelDelete}
                    className="rounded-md border border-border px-2 py-0.5 text-[11px] text-foreground hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-muted/30">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] text-muted-foreground/80">{task.name}</p>
                    <p className="text-[10px] text-muted-foreground/50">
                      {formatTimeAgo(deletedAt)} · {formatTimeRemaining(deletedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover/deleted:opacity-100 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Restore ${task.name}`}
                          onClick={() => handleRestore(id)}
                          className="flex size-5 items-center justify-center rounded-md text-muted-foreground/60 hover:bg-primary/15 hover:text-primary"
                        >
                          <IconRestore className="size-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Restore</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Permanently delete ${task.name}`}
                          onClick={() => handlePermanentDelete(id)}
                          className="flex size-5 items-center justify-center rounded-md text-muted-foreground/60 hover:bg-destructive/15 hover:text-destructive"
                        >
                          <IconTrash className="size-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Delete permanently</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
})
