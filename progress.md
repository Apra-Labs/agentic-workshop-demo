# Progress — React Frontend for NoteAPI

## Phase 1: Project Setup + NoteList — Complete
- Vite + React + TypeScript scaffolded in `frontend/`
- Vite proxy: `/api` → `http://localhost:3000`
- Components: NoteList, NoteCard, LoadingSpinner, ErrorMessage
- API wrapper: `fetchNotes()` with error handling

## Phase 2: Create Note — Complete
- NoteForm component with title, content, tags fields
- Client-side validation (title and content required)
- POST to `/api/notes`, list refreshes on success

## Phase 3: Edit Note — Complete
- Click Edit on any note to open pre-filled form
- PUT to `/api/notes/:id`, list refreshes on save

## Phase 4: Delete Note — Complete
- Delete button on each note card
- Confirmation dialog before deletion
- DELETE to `/api/notes/:id`, list refreshes after

## Tests: 13 passing
- API wrapper: fetch, create, update, delete (7 tests)
- NoteList: loading, render, error, empty, form toggle, create flow (6 tests)

## What's working
- Full CRUD from the browser: create, read, edit, delete notes
- Loading spinner while fetching
- Error messages on API failure
- Empty state prompts user to create first note
- Tags displayed as colored pills, entered as comma-separated text
