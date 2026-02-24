# Feature: React Frontend for NoteAPI

## Problem Statement
The NoteAPI backend has full CRUD + search + tag filtering, but no user interface. We need a React frontend that lets users view, create, edit, and delete notes through the browser.

## Constraints
- React + TypeScript with Vite (fast dev server, modern tooling)
- No CSS framework — plain CSS only
- No state management library — React hooks (`useState`, `useEffect`) only
- No `axios` — use the native `fetch` API
- Frontend runs on port 3001, backend on port 3000
- Vite proxy handles CORS (no backend changes needed)
- Tests use Vitest (bundled with Vite)

## Phases

### Phase 1: Project Setup + NoteList
- [ ] Scaffold Vite + React + TypeScript project in `frontend/`
- [ ] Configure Vite proxy: `/api` → `http://localhost:3000`
- [ ] Create API wrapper (`api.ts`) with `fetchNotes()` function
- [ ] Create `NoteList` component — fetches and displays all notes
- [ ] Create `NoteCard` component — displays a single note (title, content, tags)
- [ ] Add `LoadingSpinner` component for loading state
- [ ] Add `ErrorMessage` component for error state
- [ ] Write tests: NoteList renders notes, API wrapper calls correct endpoint
- **Deliverable:** Browser shows list of notes from backend API

### Phase 2: Create Note
- [ ] Create `NoteForm` component with title, content, and tags fields
- [ ] POST to `/api/notes` on submit
- [ ] Refresh note list after successful creation
- [ ] Validate: title and content are required
- [ ] Show success/error feedback
- [ ] Write tests: form submission, validation
- **Deliverable:** User can create a new note from the UI

### Phase 3: Edit Note
- [ ] Click a note to open it in the edit form
- [ ] Pre-fill the form with existing note data
- [ ] PUT to `/api/notes/:id` on save
- [ ] Refresh note list after successful update
- [ ] Write tests: edit mode, pre-filled values, update submission
- **Deliverable:** User can click a note, edit it, and save changes

### Phase 4: Delete Note
- [ ] Add delete button to each note card
- [ ] Confirm before deleting ("Are you sure?")
- [ ] DELETE to `/api/notes/:id`
- [ ] Refresh note list after successful deletion
- [ ] Write tests: delete button, confirmation, successful deletion
- **Deliverable:** User can delete a note with confirmation
