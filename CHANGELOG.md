# Changelog

## [v0.12.0] - 2026-04-18

### Features

- link commit hashes to GitHub in release notes ([`8075333`](https://github.com/thabti/kirodex/commit/807533344773aa9434e2bf80030be656fe89f4ea))
- workspace diff support and commit input ([`abeaeb5`](https://github.com/thabti/kirodex/commit/abeaeb5d7e28299cb577b084b19b2b24a2df8fe4))
- add commit message generation utils with tests ([`dbd3341`](https://github.com/thabti/kirodex/commit/dbd334165e2a35af9b9e3c796dd2dfa82b2b4350))
- stage button icon swap feedback and staged count in toolbar ([`4197010`](https://github.com/thabti/kirodex/commit/4197010e9e7e77a48174bed1b897ac88d95b5fe7))
- add 'created' sort option as default ([`b8f33a3`](https://github.com/thabti/kirodex/commit/b8f33a369c6559408d1707f50bc9fc8dc4c1bfef))
- expand open_in_editor with terminal emulators and cross-platform support ([`852ee96`](https://github.com/thabti/kirodex/commit/852ee963a649137796ccc1083efb1e5baf1d6b5c))
- add useProjectIcon, extend useSlashAction and useChatInput ([`348536d`](https://github.com/thabti/kirodex/commit/348536d0515013470ba0b301ec7e833f0e5e9815))
- replace xterm.js with ghostty-web WASM terminal ([`72faa70`](https://github.com/thabti/kirodex/commit/72faa702858e24abeb61b85a206507b167b835d1))
- add Kiro ghost logo and sponsored-by Lastline to hero ([`35b43fd`](https://github.com/thabti/kirodex/commit/35b43fddb19093897b56a8d1337fc9737949fd11))

### Bug fixes

- merge staged and unstaged diffs to avoid double-counting ([`1722664`](https://github.com/thabti/kirodex/commit/17226644222421ee593a9533f0e1a26f994d5610))

### Refactoring

- split taskStore into types, listeners, and core modules ([`4f81d87`](https://github.com/thabti/kirodex/commit/4f81d87434ff4c013484dff8f5eef6526de889b2))
- extract DiffViewer sub-components and utilities ([`896ad0d`](https://github.com/thabti/kirodex/commit/896ad0d3364e3af5ce0a59f139b669b3762f438c))
- extract kiro config sub-components and add project icon picker ([`57c3250`](https://github.com/thabti/kirodex/commit/57c3250d2dc3fbfe5e932fa81226bba72d508e6e))
- extract settings sections into individual modules ([`d196e59`](https://github.com/thabti/kirodex/commit/d196e593f9e2227e707a98137781189b0dc94eec))
- extract onboarding step components from monolithic Onboarding.tsx ([`b464d8a`](https://github.com/thabti/kirodex/commit/b464d8ac8148daf6b44ea14c896df9000d0a7f34))
- split AppHeader into breadcrumb, toolbar, and user-menu modules ([`daec3c8`](https://github.com/thabti/kirodex/commit/daec3c894fc3fff5cfa0040d82d543116d1611ec))
- extract chat sub-components from monolithic files ([`1dd5e51`](https://github.com/thabti/kirodex/commit/1dd5e516ac36310c354e051349910b0783a0a21f))
- migrate std::sync::Mutex to parking_lot ([`039183c`](https://github.com/thabti/kirodex/commit/039183cecf9af8d15235a87f2dff2bf300030cb4))
- split monolithic acp.rs into modular subfiles ([`a4973fe`](https://github.com/thabti/kirodex/commit/a4973fe929ed33a79de41726de841e555a8557c7))

### Documentation

- update activity log with session entries ([`216eb40`](https://github.com/thabti/kirodex/commit/216eb401c956037e6a4eef7e5abc19dca5ac7ba1))
- add IPC reference, keyboard shortcuts, slash commands, and security audits ([`58a6fc4`](https://github.com/thabti/kirodex/commit/58a6fc4b1973e3e1e0b8dc9b8182eb25277ec2aa))
- update main screenshot ([`823b82b`](https://github.com/thabti/kirodex/commit/823b82bf895817f28d57d2400cd6720f2b204c7d))

### Chores

- update activity logs, plans, website, and build config ([`c3600d6`](https://github.com/thabti/kirodex/commit/c3600d63d1a50b669f38e38116608cdd6d4fe7ae))

## [v0.11.0] - 2026-04-16

### Features

- add features section and brew install terminal block
- adopt minimal website (#13)

### Bug fixes

- auto-retry on refusal and improved error display
- friendly error messages for model errors and filter agent-switch noise
- friendly error messages for model permission and access errors

### Documentation

- update activity log
- update activity log

### Chores

- update downloads.json

## [v0.10.1] - 2026-04-16

### Features

- add cross-platform support for Windows and Linux

### Styling

- unify system message rows to muted inline style

## [v0.10.0] - 2026-04-16

### Features

- overhaul title bar with native traffic light repositioning

### Bug fixes

- use bg-background instead of bg-card for dark mode consistency

### Styling

- change primary color from indigo to blue-500

## [v0.9.2] - 2026-04-16

### Features

- detect worktree-locked branches and add force checkout
- force checkout option and worktree branch locking
- show confirmation dialog before deleting worktree threads
- worktree-aware workspace sync and pink theme token
- worktree-aware sidebar grouping and input improvements
- worktree-aware components and terminal improvements
- workspace sandbox for ACP and worktree validation
- worktree-aware project identity and per-project config caching
- worktree support in utils, timeline, and history-store
- add projectId field to AgentTask
- support Cmd+Shift+V for raw paste without placeholder

### Bug fixes

- friendly errors, worktree lock UI, force checkout

### Documentation

- update activity log
- log worktree confirmation dialog session in activity.md
- log commit organization session in activity.md
- update activity logs
- add CLAUDE.md for analytics service

### Chores

- add slugify and xterm-addon-web-links
- remove kirodex-rules steering file

## [v0.9.1] - 2026-04-15

### Bug fixes

- remove error fallback, improve update dot, enable devtools (#12)

### Styling

- lighter palette, performance hero, blue icon branding
- bigger fonts, lighter palette, blue production icon

### Documentation

- add performance stats badges
- add 7 engineering learnings from session

## [v0.9.0] - 2026-04-15

### Features

- add threadName and projectName to JsDebugEntry
- add full landing page content, changelog, and deploy workflow
- add thread and project filtering to JS Debug tab
- add landing page with screenshots and Tailwind styling
- add git worktree support with /branch and /worktree commands
- add JS Debug tab with console, error, network, and Rust log capture
- plan-aware context compaction

### Bug fixes

- make local dev work and use blue production icon
- prevent bun test from running vitest files without jsdom
- stamp threadName/projectName on JS debug entries

### Documentation

- update activity log with website and changelog entries

### Tests

- suppress console.warn stderr noise in dismissVersion test

## [v0.8.15] - 2026-04-15

### Features

- add inline rename for project and thread breadcrumbs

## [v0.8.14] - 2026-04-15

### Features

- upgrade to onboarding v2 with privacy toggle
- add Recently Deleted section with soft-delete thread recovery
- combine completion report card with changed files summary
- add provider-specific icons to model picker
- redesign into 3-step flow with platform install commands
- rewrite notification system with queue and debounce
- add Cmd+F message search with highlighting
- add light/dark/system theme support
- add restart prompt dialog and sidebar update indicator

### Bug fixes

- make task_fork async and add parent_task_id to Task

### Styling

- improve light mode contrast and add dark mode color variants
- improve light/dark mode contrast for CSS tokens
- bump base font to 14px, light mode fixes, and UI polish

### Refactoring

- move RecentlyDeleted from sidebar to SettingsPanel

### Documentation

- update activity log with commit review session
- update README features and refresh screenshots

### CI

- add update-downloads workflow

### Tests

- improve frontend test coverage across stores, lib, hooks, and components
- add unit tests for 0.8.13 changes and About dialog

## [v0.8.13] - 2026-04-15

### Features

- wire up fork_session and add collapsible chat input
- forward compaction status notification to frontend
- add X close button to FileMentionPicker
- add X close button to SlashPanels dropdown
- add /usage slash command for token usage panel
- redesign plan mode question cards for better approachability

### Bug fixes

- improve X close button UX in dropdown panels
- resolve message list layout overlap from stale virtualizer measurements
- prevent empty tasks array from skipping completed_task_ids

### Styling

- improve answered questions UI

### Refactoring

- replace virtualizer with plain DOM flow in MessageList

### Documentation

- update activity log
- update activity log
- update activity log

## [v0.8.12] - 2026-04-14

### Features

- add empty thread splash screen with mid-sentence slash and mention support
- add fuzzy search to slash commands and agent/model panels
- extract fuzzy search util and apply to @ mention picker
- enhance agent mention pills with built-in agents and styled icons
- archive threads on /close and show .kiro agents in /agent panel
- add archiveTask action to taskStore
- add built-in agent picker to /agent slash panel
- increase check frequency and add sidebar badge
- add plan agent handoff card
- extract question parser, harden edge cases, add plan-mode preprompt
- ChatInput UX improvements — focus ring, send transition, collapsible pills, tests
- add code viewer for read tool calls

### Bug fixes

- resolve unused variable warning and failing settings test
- refresh git branch name on window focus
- remove stale question_format placeholder from full_prompt
- send /agent command on mode switch and make plan mode per-thread
- require all questions answered before submit and default answers expanded
- check rawInput for completed_task_ids in task list aggregation
- last task in task list never shown as completed
- replace oklch and Tailwind color vars with concrete hex values
- remove inner focus ring from ChatInput textarea

### Styling

- improve ChatInput background color and border width
- use #2c2e35 background for chat input and user message bubble
- complete Linear/Codex-inspired colour overhaul and sidebar density upgrade
- color loading text by mode — blue default, teal planning

### Documentation

- update activity log with agent mention pill changes
- update activity log
- update activity log

## [v0.8.11] - 2026-04-14

### Features

- navigate to correct thread on notification click
- ChatInput UX improvements
- auto-generate grouped release notes from commits
- default analyticsEnabled to true
- ghost placeholders when no project is open, swap auth icon

### Bug fixes

- handle refusal stop reason and finalize tool calls on turn end
- prevent message area layout overlap with multiple messages
- harden layout, fix scroll-to-bottom positioning and hover, add word-break