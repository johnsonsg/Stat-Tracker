# Stat Tracker Technical Overview

## Tech Stack

### Frontend
- React 19 + Vite
- TypeScript
- MUI (Material UI) with custom theme
- React Router
- Jotai (state)
- Socket.IO client

### Backend
- Node.js 20 + Express
- TypeScript
- MongoDB + Mongoose
- Zod (validation)
- Socket.IO
- Swagger (OpenAPI)
- Clerk (auth + orgs)

## Middleware (Backend)

Configured in [backend/src/app.ts](../backend/src/app.ts):
- `cors` (open origin + credentials)
- `express.json()`
- `requestLogger`
- `clerkAuthMiddleware` (Clerk session parsing)
- `/api` protected by `requireAuthMiddleware` + `tenantMiddleware`
- `errorHandler`

### Auth/Tenancy
- `tenantMiddleware` uses Clerk `orgId` and sets `req.tenantId`.
- All tenant-scoped services read `tenantId` from the request.

## Websockets

### Server
- Socket.IO server in [backend/src/websocket/socketServer.ts](../backend/src/websocket/socketServer.ts)
- Rooms:
  - `game:{gameId}` for live game events
  - `tenantId` for tenant-wide events

### Client
- Socket.IO client in [frontend/src/services/socket.ts](../frontend/src/services/socket.ts)
- Used for live updates (plays, game status, connection badge)

## Services

### Frontend
- `socket.ts`: shared Socket.IO client
- `api.ts`: reserved for future HTTP wrapper (currently empty)

### Backend (modules)
- `teamData`: reads and writes tenant data using `tenant-settings` collection
- `games`: game CRUD + status updates
- `playEvents`: play-by-play events
- `stats`: derived stats recomputation from plays

## Data Model (Mongo)

### Tenant Settings (Source of Truth)
- Collection: `tenant-settings`
- Fields used by Stat Tracker:
  - `tenantId` (Clerk orgId)
  - `metadata.teamName`
  - `players[]`
  - `schedule.games[]`

### Game Data (Stat Tracker)
- `games`
- `playEvents`
- `playerGameStats`
- `teamGameStats`

## UI Pages

- Dashboard: summary stats + recent games
- Game Tracker: live play entry + sockets
- Team: roster/schedule setup wizard
- Roster & Schedule: read-only view of tenant data
- Players: stats by game
- Profile

## Auth Flow

- Clerk provides user + org context
- Backend enforces org membership for write actions
- `orgId` = tenant ID across all collections

## Dev Workflows

### Backend
- `npm run -w backend dev`
- `npm run -w backend lint`
- `npm run -w backend typecheck`

### Frontend
- `npm run -w frontend dev`
- `npm run -w frontend lint`
- `npm run -w frontend typecheck`

## Environment Variables

### Frontend
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_API_URL` (optional; defaults to http://localhost:4000)

### Backend
- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `MONGODB_URI`
- `PORT`
- `NODE_ENV`

## Notes

- `tenant-settings.tenantId` must match the Clerk orgId.
- Live game events are scoped to `game:{gameId}` rooms.
- Derived stats are recalculated when plays are edited/deleted.
