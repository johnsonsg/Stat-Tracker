# Stat Tracker Monorepo

This repository contains both the Stat Tracker UI and the Stat Tracker API.

## Structure

- frontend: React + Vite + MUI stat console
- backend: Node + Express + MongoDB + Socket.io + Clerk auth
- docs: architecture and multi-tenant notes

## Quick Start

1) Install dependencies

- npm install

2) Start the UI

- npm run dev:frontend

3) Start the API

- npm run dev:backend

## Environment

Copy env examples and fill values:

- backend/.env.example -> backend/.env
- frontend/.env.example -> frontend/.env (if present)

Frontend env notes:

- VITE_CLERK_PUBLISHABLE_KEY (required for auth)
- VITE_TEAM_APP_BASE_URL (Team App media base URL; default is http://localhost:3000)

See docs for details.
