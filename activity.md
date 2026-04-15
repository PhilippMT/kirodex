# Activity Log

## 2026-04-15 12:15 GST (Dubai)

### CI: Add update-downloads workflow

Created `.github/workflows/update-downloads.yml` that runs daily at 06:30 UTC. Collects GitHub release download counts (per-asset, per-platform totals) and Homebrew tap clone stats from `thabti/homebrew-tap`, then writes `downloads.json` to the main branch. Requires a `TAP_TOKEN` repo secret with read access to the tap repo for Homebrew data.

**Modified:** `.github/workflows/update-downloads.yml`

## 2026-04-15 12:06 (Dubai)

### Fix light mode contrast issues in chat components (batch 3)

Fixed low-contrast text and border classes across 13 chat component files:

- **ChatPanel.tsx** - `text-muted-foreground/50` → `/80`, `text-blue-400/30` → `text-blue-600/30 dark:text-blue-400/30`, `text-blue-400/50` → `text-blue-600/50 dark:text-blue-400/50`, `bg-card/50` → `bg-card`
- **MessageItem.tsx** - `text-muted-foreground/60` → `text-muted-foreground`, `text-teal-400` → `text-teal-600 dark:text-teal-400`
- **UserMessageRow.tsx** - `text-muted-foreground/60` → `text-muted-foreground`, `text-blue-400` → `text-blue-600 dark:text-blue-400`, `text-yellow-400` → `text-yellow-600 dark:text-yellow-400`, `border-border/30` → `border-border/60`
- **SystemMessageRow.tsx** - `text-blue-400` → `text-blue-600 dark:text-blue-400`
- **PendingChat.tsx** - `text-muted-foreground/50` → `text-muted-foreground/80`, `text-amber-400` → `text-amber-600 dark:text-amber-400`
- **AttachmentPreview.tsx** - `text-foreground/20` → `text-foreground/50`, `bg-black/20` → `bg-muted`, `bg-black/10` → `bg-muted/60`
- **QueuedMessages.tsx** - All `text-muted-foreground/60` → `text-muted-foreground`
- **ReadOutput.tsx** - `text-muted-foreground/60` → `text-muted-foreground`, `border-border/30` → `border-border/60`
- **TaskCompletionCard.tsx** - `text-muted-foreground/60` → `text-muted-foreground`
- **BranchSelector.tsx** - `text-muted-foreground/60` → `text-muted-foreground`
- **ModelPicker.tsx** - `text-muted-foreground/70` → `text-muted-foreground`
- **SearchBar.tsx** - `text-muted-foreground/60` → `text-muted-foreground`
- **ContextUsageBar.tsx** - `text-muted-foreground/60` → `text-muted-foreground`
- **HighlightText.tsx** - No changes needed (already uses proper light/dark variants)

## 2026-04-15 12:06 (Dubai)

### Fix light mode contrast issues in chat components (batch 1)

Fixed low-contrast text in 6 chat component files:

1. **EmptyThreadSplash.tsx** - Fixed `text-foreground/50` → `/70`, `text-muted-foreground/25-30` → `text-muted-foreground`, `text-muted-foreground/40` → `/70`. Converted all hardcoded `-400` colors to `text-X-600 dark:text-X-400` pattern (teal, amber, purple, red, sky, blue, orange, emerald, cyan, indigo).

2. **ChatInput.tsx** - Fixed `text-foreground/25` → `/50`, `text-foreground/30` → `/50`, `text-foreground/40` → `/60`, `text-muted-foreground/50` → `/80`, `text-muted-foreground/60` → `text-muted-foreground`, `placeholder:text-muted-foreground/60` → `placeholder:text-muted-foreground`.

3. **ChatMarkdown.tsx** - Fixed `text-muted-foreground/50` → `/80` (2 occurrences: copy button and code block language label).

4. **QuestionCards.tsx** - Fixed `text-muted-foreground/50` → `/80`, `text-muted-foreground/40` → `/70`, `placeholder:text-muted-foreground/40` → `placeholder:text-muted-foreground/70`.

5. **SlashPanels.tsx** - Fixed `text-muted-foreground/60` → `text-muted-foreground`, `text-blue-400` → `text-blue-600 dark:text-blue-400`, `text-teal-400` → `text-teal-600 dark:text-teal-400`, `text-violet-400` → `text-violet-600 dark:text-violet-400`.

6. **SlashCommandPicker.tsx** - Fixed `text-muted-foreground/60` → `text-muted-foreground`.

## 2026-04-15 12:06 (Dubai) - Fix light mode contrast issues across 13 component files

### Changes made
Fixed low-contrast text and border opacity values across 13 files to improve light mode readability:

**Opacity fixes (muted-foreground):**
- `text-muted-foreground/50` → `text-muted-foreground/80`
- `text-muted-foreground/40` → `text-muted-foreground/70`
- `text-muted-foreground/60` → `text-muted-foreground`

**Opacity fixes (border):**
- `border-border/20` → `border-border/50`
- `border-border/30` → `border-border/60`
- `border-border/40` → `border-border/70`

**Hardcoded dark-only colors → light+dark responsive:**
- `text-X-400` → `text-X-600 dark:text-X-400` (red, blue, green, emerald, cyan, sky, yellow, violet, amber, teal, indigo, rose, pink, orange, gray)

**Other fixes:**
- `bg-card/50` → `bg-card`
- `text-foreground/30` → `text-foreground/50`
- `text-foreground/35` → `text-foreground/60`
- `fill-muted-foreground/20` → `fill-muted-foreground/60`
- `placeholder:text-muted-foreground/35` → `placeholder:text-muted-foreground/70`

### Files modified
1. settings/SettingsPanel.tsx (23 changes)
2. settings/AboutDialog.tsx (3 changes)
3. sidebar/KiroConfigPanel.tsx (~20 changes)
4. sidebar/KiroFileViewer.tsx (1 change)
5. AppHeader.tsx (3 changes)
6. ErrorBoundary.tsx (1 change)
7. GitActionsGroup.tsx (1 change)
8. debug/DebugPanel.tsx (6 changes)
9. diff/DiffPanel.tsx (3 changes)
10. code/DebugLog.tsx (1 change)
11. chat/FileMentionPicker.tsx (~20 changes)
12. chat/ChangedFilesSummary.tsx (2 changes)
13. dashboard/Dashboard.tsx (1 change)
