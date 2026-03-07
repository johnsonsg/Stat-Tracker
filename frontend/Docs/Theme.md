# Theme

## Stack
- **UI library:** MUI (Material UI)
- **Theme definitions:** `src/theme/theme.ts` (light/dark themes)
- **Provider:** `src/theme/ThemeProvider.tsx`
- **Baseline:** MUI `CssBaseline` applied globally
- **Mode state:** Jotai atom persisted to storage

## How it’s wired
- `AppThemeProvider` wraps the app (see `src/main.tsx`).
- `ColorModeContext` exposes:
  - `themeMode: "light" | "dark"`
  - `toggleTheme(): void`

## Persistence
- `themeModeAtom` uses `atomWithStorage`:
  - Key: `site.themeMode`
  - Default: `"dark"`
  - Storage: `getBrowserStorage()` (safe for non‑browser environments)

## Toggle UI
- The header uses an icon button (Sun/Moon) to call `toggleTheme`.
- Hover styles are adjusted via MUI `GlobalStyles` in `ThemeProvider`.

## Files
- `src/theme/theme.ts`
- `src/theme/ThemeProvider.tsx`
- `src/theme/ColorModeContext.ts`
- `src/state/themeModeAtom.ts`
- `src/state/storage.ts`
- `src/components/AppHeader.tsx`
