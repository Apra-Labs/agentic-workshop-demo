# NoteAPI

REST API for managing notes with tags and search. Node.js + Express + TypeScript, in-memory store.

## Commands
- `npm test` — run all tests (Jest)
- `npm run test:coverage` — run tests with coverage report
- `npm start` — start server on port 3000
- `npm run lint` — check for lint errors
- `npm run lint:fix` — auto-fix lint errors
- `npm run build` — compile TypeScript to dist/

## Code Conventions
- All API handlers go in `src/api/` — one file per resource
- Validate inputs before processing — use helpers from `src/utils/validation.ts`
- Never return raw error objects to the client — wrap in `{ error: "message" }`
- Use `res.status(code).json(...)` — never `res.send()` for API responses
- Tests use supertest against the Express app (not a running server)

## Frontend
- React + TypeScript frontend in `frontend/` directory
- Runs on port 3001 (Vite dev server) — backend stays on port 3000
- Uses the existing REST API endpoints (`/api/notes`)
- React hooks only (`useState`, `useEffect`) — no state management library
- Vitest for testing (same test-first approach as backend)

## What NOT To Do
- No `console.log` in route handlers — use structured responses
- No `any` types — use proper interfaces from `src/models/`
- Don't install a database — the in-memory store is intentional
