# Kirodex (Tauri)

A macOS desktop client for interacting with AI coding agents through the Kiro CLI, built with Tauri v2 + React + TypeScript.

## Prerequisites

- **Rust** >= 1.78 + **Cargo** (via [rustup](https://rustup.rs))
- **Node.js** >= 20 or **Bun** >= 1.0
- **kiro-cli** installed and in your PATH
- **macOS** (uses macOS-specific window APIs)

## Setup

```bash
git clone <repo-url> kantoku-tauri
cd kantoku-tauri
git checkout tauri-migration

bun install    # or: npm install
```

### Installing Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```

Verify with `rustc --version` and `cargo --version` (both should be >= 1.78). Update anytime with `rustup update`.

## Development

```bash
bun run dev
```

This runs `cargo tauri dev`, which starts the Vite dev server on `http://localhost:5173`, compiles the Rust backend, and opens the Kirodex window.

- Frontend changes (`src/renderer/**`) hot-reload instantly.
- Rust changes (`src-tauri/src/**`) trigger a recompile (a few seconds after the first build).

## Build

```bash
bun run build
```

Produces a release binary at `src-tauri/target/release/kirodex` (~8.4 MB on arm64 macOS).

### Individual layers

```bash
bun run build:renderer          # Frontend only
cd src-tauri && cargo build     # Rust debug
cd src-tauri && cargo build --release  # Rust release
npx tsc --noEmit                # Type check frontend
cd src-tauri && cargo check     # Check Rust without building
```

## Project structure

```
kantoku-tauri/
├── src/
│   ├── renderer/               # React frontend
│   │   ├── components/         # UI components (chat, sidebar, settings)
│   │   ├── stores/             # Zustand state stores
│   │   ├── lib/
│   │   │   ├── ipc.ts          # Tauri invoke/listen bridge
│   │   │   └── utils.ts
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── tailwind.css
├── src-tauri/
│   ├── src/
│   │   ├── main.rs             # Entry point
│   │   ├── lib.rs              # Tauri app setup, command registration
│   │   └── commands/
│   │       ├── acp.rs          # ACP protocol (kiro-cli subprocess)
│   │       ├── settings.rs     # JSON settings store
│   │       ├── git.rs          # Git operations
│   │       ├── fs_ops.rs       # File ops, kiro-cli detection, editor launch
│   │       ├── pty.rs          # Terminal (portable-pty)
│   │       └── kiro_config.rs  # .kiro/ config discovery
│   ├── Cargo.toml
│   ├── tauri.conf.json         # Window config, plugins, build settings
│   ├── capabilities/           # Tauri v2 permission capabilities
│   └── build.rs
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

## Architecture

**Frontend** (React + TypeScript): Communicates with the backend via `@tauri-apps/api` `invoke()` for commands and `listen()` for events.

**Backend** (Rust): Replaces Electron's Node.js main process.

| Module | Purpose |
|--------|---------|
| `acp.rs` | Spawns `kiro-cli acp` as a subprocess, implements the ACP `Client` trait via [`agent-client-protocol`](https://crates.io/crates/agent-client-protocol). Each connection runs on a dedicated OS thread with a single-threaded tokio runtime (`!Send` futures). Communicates with the Tauri async runtime via `mpsc` channels. |
| `settings.rs` | Persists settings to `~/Library/Application Support/kantoku/kantoku-store.json`. |
| `git.rs` | Git operations via `std::process::Command`. |
| `fs_ops.rs` | File operations, kiro-cli path detection, editor launching. |
| `pty.rs` | Terminal emulation via `portable-pty`. |
| `kiro_config.rs` | `.kiro/` config directory discovery. |

## Configuration

On first launch, set the kiro-cli path in Settings. The app auto-detects these locations:

1. `~/.local/bin/kiro-cli`
2. `/usr/local/bin/kiro-cli`
3. `~/.kiro/bin/kiro-cli`
4. `/opt/homebrew/bin/kiro-cli`

Falls back to `which kiro-cli` if none are found.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Failed to spawn kiro-cli" | Verify kiro-cli is installed and the path in Settings is correct. Run `kiro-cli --version` to check. |
| Rust compilation errors | Run `rustup update`. The ACP SDK requires Rust >= 1.78. |
| Frontend type errors | Run `bun install`, then `npx tsc --noEmit`. |
| First build is slow | Normal. The initial `cargo build` compiles ~400 crates. Subsequent builds are incremental. |

## License

© 2026 Kirodex. All rights reserved.
