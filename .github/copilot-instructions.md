# Copilot instructions

## Project overview
- Vite + React 19 + TypeScript UI; entry is [frontend/src/main.tsx](frontend/src/main.tsx).
- UI uses MUI with a shared theme from [frontend/src/theme/theme.ts](frontend/src/theme/theme.ts), applied via `ThemeProvider` in [frontend/src/main.tsx](frontend/src/main.tsx).
- Domain UI is intended around a “game tracker” flow; current page wiring is minimal and mostly placeholders (e.g., [frontend/src/pages/GameTracker.tsx](frontend/src/pages/GameTracker.tsx) renders `GameConsole`, while [frontend/src/App.tsx](frontend/src/App.tsx) is still the Vite starter).

## Architecture & data flow (current state)
- **Pages vs components**: page-level screens live in [frontend/src/pages](frontend/src/pages) (e.g., [frontend/src/pages/GameTracker.tsx](frontend/src/pages/GameTracker.tsx)); reusable UI sits in [frontend/src/components](frontend/src/components) (e.g., [frontend/src/components/GameConsole.tsx](frontend/src/components/GameConsole.tsx)).
- **Services layer**: real-time updates are expected via Socket.IO using the client in [frontend/src/services/socket.ts](frontend/src/services/socket.ts) (`io("http://localhost:4000")`). [frontend/src/services/api.ts](frontend/src/services/api.ts) exists but is currently empty.
- **Types**: data shapes are intended to live in [frontend/src/types](frontend/src/types), but files are currently empty placeholders.

## Developer workflows
- Dev server: `npm run dev`
- Production build: `npm run build`
- Lint: `npm run lint`
- Preview build: `npm run preview`

## Project-specific conventions to follow
- Prefer MUI components and theme tokens (see [frontend/src/theme/theme.ts](frontend/src/theme/theme.ts)) instead of custom styling when building new UI.
- Keep page-level wiring in [frontend/src/pages](frontend/src/pages) and extract reusable pieces into [frontend/src/components](frontend/src/components).
- When adding realtime features, use the shared Socket.IO instance from [frontend/src/services/socket.ts](frontend/src/services/socket.ts) rather than creating new connections.

## Integration points
- Socket.IO backend is expected at `http://localhost:4000` (see [frontend/src/services/socket.ts](frontend/src/services/socket.ts)).
- HTTP client dependency (`axios`) is available, but there is no established API wrapper yet (see [frontend/src/services/api.ts](frontend/src/services/api.ts)).

## Notes for AI changes
- If you introduce routing, use `react-router-dom` (already in dependencies) and wire it from [frontend/src/App.tsx](frontend/src/App.tsx) and/or [frontend/src/main.tsx](frontend/src/main.tsx).
- If you add domain models, place them in [frontend/src/types](frontend/src/types) and import them from components/pages.
