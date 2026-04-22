# Requirements — Note Sharing & Permissions

## Base Branch
`main` — branch to fork from and merge back to

## Goal
Add a note sharing system to the NoteAPI. Users can create shareable links
for individual notes with configurable permissions and optional expiry.

## New endpoints

### POST /api/notes/:id/shares
Create a share link for a note.
Request body: { "permission": "read"|"edit"|"admin", "expiresInMinutes": 60 }
Response: { "shareToken": "abc123", "permission": "read", "expiresAt": "..." }
Returns 404 if note does not exist.
Generates a cryptographically random token (crypto.randomBytes).

### GET /api/shares/:token
Returns the full note object. 404 if not found. 403 if expired.

### DELETE /api/shares/:token
Revokes a share. Returns 204. 404 if not found.

## Data model
interface Share {
  id: string;           // same as shareToken
  noteId: string;
  permission: 'read' | 'edit' | 'admin';
  createdAt: string;
  expiresAt: string | null;
}
Store in memory (same pattern as note store).

## Cascade delete
Deleting a note must delete all its shares.

## Tests required
- POST creates share and returns token
- POST returns 404 for missing note
- GET returns note for valid token
- GET returns 403 for expired token
- GET returns 404 for unknown token
- DELETE revokes share
- Cascade: deleting note removes shares
