# Kirodex Tauri Activity Log

## 2026-04-12 02:19 (Dubai)

Removed macOS private API usage and custom title bar styling. Switched to standard window decorations with HudWindow vibrancy and 12px corner radius.

Changes made:
- `src-tauri/tauri.conf.json`: Removed `macOSPrivateApi: true`, `titleBarStyle: "Overlay"`, and `hiddenTitle: true` from window config
- `src-tauri/Cargo.toml`: Confirmed `tauri` features already empty (`[]`); removed `cocoa = "0.26.1"` macOS dependency
- `src-tauri/src/lib.rs`: Replaced Sidebar vibrancy + cocoa NSColor background hack with single `HudWindow` vibrancy call (corner radius 12.0)
- `src/tailwind.css`: Changed `#root` from `height: calc(100% - 28px)` to `100vh`/`100vw` with `border-radius: 12px`, `background: var(--background)`, and `border: 0.5px solid var(--border)`
