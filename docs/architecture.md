# Architecture

Stat Tracker follows a split frontend/backend design.

Frontend
- React + Vite
- MUI components and theme
- Socket.io client for live updates

Backend
- Express API with Socket.io server
- MongoDB for persistence
- Clerk for authentication
- Tenant-aware middleware for multi-tenant routing

Data Flow
1. User signs in with Clerk
2. Tenant is resolved from host or header
3. API attaches tenantId to request
4. All queries are filtered by tenantId
5. WebSocket events are emitted per tenant
