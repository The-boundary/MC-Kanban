# MC-Kanban Project Context

## Project Overview

MC-Kanban - Kanban board app for The Boundary platform. Supports app boards, project boards, and personal/shared boards.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 5, TailwindCSS 3.4, Shadcn/ui, @dnd-kit
- **Backend**: Express, TypeScript, Node.js
- **Database**: Supabase (PostgreSQL), schema: `kanban`
- **Deployment**: Docker, GitHub Container Registry, Watchtower
- **Design System**: @the-boundary/design-system

## Development

### Running Locally

```bash
npm install
npm run dev
```

- Frontend: http://192.168.0.51:5173
- Backend: http://localhost:3049

### Project Structure

```
client/           # React frontend
  src/
    components/   # UI components (ui/, layout/, shared/, board/, card/, dashboard/)
    pages/        # Page components
    hooks/        # React hooks (api/ for React Query hooks)
    lib/          # Utilities
    stores/       # Zustand stores
    context/      # React contexts (AuthContext)
server/           # Express backend
  src/
    routes/       # API routes
    services/     # Business logic (supabase, storage, activity)
    middleware/    # Auth, board-access, cache, error handler
    utils/        # Logger, route helpers
shared/           # Shared types
db/               # Database migrations
```

## Deployment

- **Container**: kanban
- **Port**: 3049
- **URL**: kanban.the-boundary.app
- **Image**: ghcr.io/the-boundary/mc-kanban
- **APP_SLUG**: kanban

## Auth

- Cookie-based SSO across \*.the-boundary.app
- Server-side auth via GoTrue (auth.the-boundary.app)
- TowerWatch permission check with APP_SLUG=kanban

## Database Schema

- Schema: `kanban`
- Tables: boards, columns, cards, labels, card_labels, checklists, checklist_items, comments, attachments, board_members, card_activity
- Cross-schema reads: `tower_watch` (users, access), `traffic_light` (kantata_workspaces for project boards)
