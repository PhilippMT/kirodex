# Activity Log


## 2026-04-09 12:20 GST (Dubai, UTC+4)

### Added ghost ChatInput to empty state

The empty state now shows a disabled replica of the ChatInput at the bottom (30% opacity, non-interactive). It mirrors the real component's structure: rounded-[20px] card, placeholder text "Ask anything, or press / for commands", pill-shaped skeleton controls in the footer bar, and a dimmed send button. Gives users a preview of the chat interface before creating a thread.

**Build:** `tsc --noEmit` ✓ | `vite build` ✓

**Modified:** `src/renderer/App.tsx`

## 2026-04-09 12:10 GST (Dubai, UTC+4)

### Added skeleton empty state with New Thread button

Replaced the plain "Select a thread" text with a ghost skeleton of a chat conversation (message bubbles at 7% opacity) and a centered "New Thread" button overlay. If the user has projects, clicking it opens a pending chat for the first project; otherwise it opens the New Project sheet.

**Build:** `tsc --noEmit` ✓ | `vite build` ✓

**Modified:** `src/renderer/App.tsx`

## 2026-04-09 12:06 GST (Dubai, UTC+4)

### Cancel running tasks on delete

Deleting a thread or removing a project now calls `ipc.cancelTask()` before `ipc.deleteTask()` to stop any running agent. The cancel is fire-and-forget with a `.catch(() => {})` so it's a no-op for already-stopped tasks.

**Build:** `tsc --noEmit` ✓ | `vite build` ✓

**Modified:** `src/renderer/components/sidebar/TaskSidebar.tsx`, `src/renderer/stores/taskStore.ts`

## 2026-04-09 11:58 GST (Dubai, UTC+4)

### Send button becomes Pause when agent is running

The send button in ChatInput now swaps to a Pause icon when the task status is `'running'` (agent is streaming/chunking). Clicking it calls `ipc.pauseTask()`. When the agent is idle, the button reverts to the send arrow.

- Added `isRunning` and `onPause` props to `ChatInput`
- ChatPanel passes `taskStatus === 'running'` and a `handlePause` callback
- Pause button uses the same round primary style as the send button

**Build:** `tsc --noEmit` ✓ | `vite build` ✓

**Modified:** `src/renderer/components/chat/ChatInput.tsx`, `src/renderer/components/chat/ChatPanel.tsx`
## 2026-04-09

- **11:57 (Dubai)** — Added copyright notice ("© 2026 Kirodex. All rights reserved.") to the end of `README.md`.
- **11:58 (Dubai)** — Completed full Rust correctness & architecture review of `src-tauri/src/` (~1,600 lines). Found 2 HIGH, 3 MEDIUM, 4 LOW, 1 INFO issues. No unsafe code. Concurrency model is sound.

## 2026-04-09 11:57 (Dubai Time) - Dynamic slash command actions

**Changes:**
- Created `useSlashAction` hook (`src/renderer/hooks/useSlashAction.ts`) that intercepts slash commands and runs client-side actions:
  - `/clear` resets chat messages for the current task
  - `/model` toggles an inline model picker panel
  - `/agent` toggles an inline MCP servers panel
  - `/plan` switches to `kiro_planner` mode
  - `/chat` switches to `kiro_default` mode
  - All other commands pass through to ACP as messages
- Built `SlashPanels.tsx` with two inline panels:
  - `ModelPickerPanel`: clickable model list with active dot indicator, updates model on click
  - `AgentListPanel`: MCP servers table showing name, status dot (green=running, amber=loading, red=error), and transport type
- Integrated into `ChatInput.tsx`: command selection calls `execute()` first; if handled client-side, clears input and returns. Panels render above textarea, dismiss on Escape or message send.

**Files created:**
- `src/renderer/hooks/useSlashAction.ts`
- `src/renderer/components/chat/SlashPanels.tsx`

**Files modified:**
- `src/renderer/components/chat/ChatInput.tsx`

**Build:** tsc ✓, vite build ✓ (5.45s)

## 2026-04-09 12:00 (Dubai Time) - Mode switch feedback for /plan and /chat

**Changes:**
- `/plan` and `/chat` now show an immediate system message confirming the switch ("Switched to Plan mode")
- IPC errors are caught and surface a warning message ("⚠️ Failed to sync Plan mode with backend")
- Extracted `switchMode()` and `addSystemMessage()` helpers in `useSlashAction.ts`

**Files modified:**
- `src/renderer/hooks/useSlashAction.ts`

**Build:** tsc ✓, vite build ✓ (5.18s)

## 2026-04-09 12:05 (Dubai Time) - Fix chat history being wiped by backend task updates

**Root cause:** `upsertTask()` did a full object replacement. The ACP backend sends `task_update` events with `messages: []` (it doesn't track message history — only the client does). Every status change from the backend wiped all locally-accumulated messages.

**Fix:**
- `upsertTask()` in `taskStore.ts` now preserves existing messages when the incoming task has an empty messages array
- `/clear` in `useSlashAction.ts` bypasses `upsertTask` and uses `setState` directly to ensure it's the only path that can wipe messages

**Files modified:**
- `src/renderer/stores/taskStore.ts` — merge logic in `upsertTask`
- `src/renderer/hooks/useSlashAction.ts` — `/clear` uses direct `setState`

**Build:** tsc ✓, vite build ✓ (4.97s)

## 2026-04-09 12:09 (Dubai Time) - Store performance audit and optimizations

**Scope:** Full review of all 5 Zustand stores (taskStore, debugStore, settingsStore, kiroStore, diffStore)

**Findings:** 9 issues (1 High, 5 Medium, 3 Low). diffStore was clean.

**Fixes applied:**

taskStore.ts (6 fixes):
- `upsertTask`: bail-out when status, messages, name, pendingPermission, plan, contextUsage are all unchanged
- `clearTurn`: bail-out when streamingChunks, thinkingChunks, liveToolCalls are already empty
- `upsertToolCall`: bail-out when tool call status + content unchanged
- `updatePlan`: reference equality check before spreading
- `updateUsage`: value equality check (used + size) before spreading
- `setSelectedTask`, `setView`, `setConnected`, `renameTask`, `renameProject`: no-op guards
- `onTurnEnd`: rewritten as single `setState` callback to avoid stale reads between multiple `getState()` calls
- `onTaskError`: rewritten as single `setState` callback

debugStore.ts (1 fix):
- `addEntry`: batched with rAF like streaming chunks. Entries accumulate in a buffer and flush once per frame via `concat + slice`, avoiding per-entry array copies during streaming

settingsStore.ts (1 fix):
- `setProjectPref`: merged double `set()` into single call with conditional spread for `currentModelId`

**Files modified:**
- `src/renderer/stores/taskStore.ts`
- `src/renderer/stores/debugStore.ts`
- `src/renderer/stores/settingsStore.ts`

**Build:** tsc ✓, vite build ✓ (5.52s)

## 2026-04-09 12:21 GST (Dubai, UTC+4)

### Show terminal and diff panel on new threads without conversation

The diff panel toggle and terminal toggle were gated behind `{task && ...}`, so they only rendered when a task existed. On a new thread (where `pendingWorkspace` is set but `task` is null), only the "Open in Editor" button showed.

Moved the diff panel and terminal toggles outside the task guard so they render whenever `workspace` is available. Git actions (commit/push) stay gated on `task` since they need `task.id` for backend calls. Pause/resume/cancel also stay task-gated.

**Modified:** `src/renderer/components/AppHeader.tsx`