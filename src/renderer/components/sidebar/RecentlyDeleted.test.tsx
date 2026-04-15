import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useTaskStore } from '@/stores/taskStore'
import type { SoftDeletedThread } from '@/types'

vi.mock('@/lib/ipc', () => ({
  ipc: {
    cancelTask: vi.fn().mockResolvedValue(undefined),
    deleteTask: vi.fn().mockResolvedValue(undefined),
    listTasks: vi.fn().mockResolvedValue([]),
    sendMessage: vi.fn().mockResolvedValue(undefined),
  },
}))
vi.mock('@/lib/history-store', () => ({
  loadThreads: vi.fn().mockResolvedValue([]),
  loadProjects: vi.fn().mockResolvedValue([]),
  loadSoftDeleted: vi.fn().mockResolvedValue([]),
  saveThreads: vi.fn().mockResolvedValue(undefined),
  saveSoftDeleted: vi.fn().mockResolvedValue(undefined),
  toArchivedTasks: vi.fn().mockReturnValue([]),
  clearHistory: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/stores/debugStore', () => ({
  useDebugStore: { getState: () => ({ addEntry: vi.fn() }) },
}))
vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: { getState: () => ({ settings: {}, saveSettings: vi.fn().mockResolvedValue(undefined) }), setState: vi.fn() },
}))
vi.mock('@/stores/diffStore', () => ({
  useDiffStore: { getState: () => ({ fetchDiff: vi.fn() }) },
}))
vi.mock('@/stores/kiroStore', () => ({
  useKiroStore: { getState: () => ({ setMcpError: vi.fn() }) },
}))

import { RecentlyDeleted } from './RecentlyDeleted'

const wrap = (ui: React.ReactNode) => <TooltipProvider>{ui}</TooltipProvider>

const makeSoftDeleted = (id: string, name: string, deletedAt?: string): SoftDeletedThread => ({
  task: {
    id,
    name,
    workspace: '/ws',
    status: 'completed',
    createdAt: '2026-01-01T00:00:00Z',
    messages: [],
    isArchived: true,
  },
  deletedAt: deletedAt ?? new Date(Date.now() - 60 * 60 * 1000).toISOString(),
})

beforeEach(() => {
  useTaskStore.setState({
    tasks: {},
    projects: [],
    deletedTaskIds: new Set(),
    softDeleted: {},
    selectedTaskId: null,
    streamingChunks: {},
    thinkingChunks: {},
    liveToolCalls: {},
    queuedMessages: {},
    activityFeed: [],
    connected: false,
    terminalOpenTasks: new Set(),
    pendingWorkspace: null,
    view: 'dashboard',
    isNewProjectOpen: false,
    isSettingsOpen: false,
    projectNames: {},
  })
})

describe('RecentlyDeleted', () => {
  it('does not render when softDeleted is empty', () => {
    const { container } = render(wrap(<RecentlyDeleted />))
    expect(container.innerHTML).toBe('')
  })

  it('renders section header with correct count', () => {
    useTaskStore.setState({
      softDeleted: {
        't1': makeSoftDeleted('t1', 'Thread 1'),
        't2': makeSoftDeleted('t2', 'Thread 2'),
      },
    })
    render(wrap(<RecentlyDeleted />))
    expect(screen.getByText('Recently deleted (2)')).toBeInTheDocument()
  })

  it('expands and collapses on header click', () => {
    useTaskStore.setState({
      softDeleted: { 't1': makeSoftDeleted('t1', 'Thread 1') },
    })
    render(wrap(<RecentlyDeleted />))
    // Initially collapsed — thread name not visible
    expect(screen.queryByText('Thread 1')).not.toBeInTheDocument()
    // Click to expand
    fireEvent.click(screen.getByText('Recently deleted (1)'))
    expect(screen.getByText('Thread 1')).toBeInTheDocument()
    // Click to collapse
    fireEvent.click(screen.getByText('Recently deleted (1)'))
    expect(screen.queryByText('Thread 1')).not.toBeInTheDocument()
  })

  it('shows thread name when expanded', () => {
    useTaskStore.setState({
      softDeleted: { 't1': makeSoftDeleted('t1', 'My Deleted Thread') },
    })
    render(wrap(<RecentlyDeleted />))
    fireEvent.click(screen.getByText('Recently deleted (1)'))
    expect(screen.getByText('My Deleted Thread')).toBeInTheDocument()
  })

  it('calls restoreTask when restore button is clicked', () => {
    useTaskStore.setState({
      softDeleted: { 't1': makeSoftDeleted('t1', 'Thread 1') },
    })
    render(wrap(<RecentlyDeleted />))
    fireEvent.click(screen.getByText('Recently deleted (1)'))
    fireEvent.click(screen.getByLabelText('Restore Thread 1'))
    // After restore, the thread should be back in tasks
    expect(useTaskStore.getState().softDeleted['t1']).toBeUndefined()
    expect(useTaskStore.getState().tasks['t1']).toBeDefined()
  })

  it('shows confirmation dialog when permanently delete is clicked', () => {
    useTaskStore.setState({
      softDeleted: { 't1': makeSoftDeleted('t1', 'Thread 1') },
    })
    render(wrap(<RecentlyDeleted />))
    fireEvent.click(screen.getByText('Recently deleted (1)'))
    fireEvent.click(screen.getByLabelText('Permanently delete Thread 1'))
    expect(screen.getByText('Delete permanently?')).toBeInTheDocument()
  })

  it('permanently deletes on confirmation', () => {
    useTaskStore.setState({
      softDeleted: { 't1': makeSoftDeleted('t1', 'Thread 1') },
    })
    render(wrap(<RecentlyDeleted />))
    fireEvent.click(screen.getByText('Recently deleted (1)'))
    fireEvent.click(screen.getByLabelText('Permanently delete Thread 1'))
    fireEvent.click(screen.getByText('Delete'))
    expect(useTaskStore.getState().softDeleted['t1']).toBeUndefined()
  })

  it('cancels permanent delete on cancel click', () => {
    useTaskStore.setState({
      softDeleted: { 't1': makeSoftDeleted('t1', 'Thread 1') },
    })
    render(wrap(<RecentlyDeleted />))
    fireEvent.click(screen.getByText('Recently deleted (1)'))
    fireEvent.click(screen.getByLabelText('Permanently delete Thread 1'))
    fireEvent.click(screen.getByText('Cancel'))
    // Thread should still be in softDeleted
    expect(useTaskStore.getState().softDeleted['t1']).toBeDefined()
    // Confirmation dialog should be gone
    expect(screen.queryByText('Delete permanently?')).not.toBeInTheDocument()
  })
})
