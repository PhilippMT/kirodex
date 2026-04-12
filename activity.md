## 2026-04-12 23:45 GST (Dubai)

### Build: Fix icon.png RGBA format for Tauri compilation

The app icon at `src-tauri/icons/icon.png` was in RGB format (no alpha channel), causing `tauri::generate_context!()` to panic with "icon is not RGBA". Converted the icon to RGBA (PNG color-type 6) using ImageMagick. Build now compiles successfully.

**Modified:** src-tauri/icons/icon.png
