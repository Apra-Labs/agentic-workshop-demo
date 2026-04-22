# NoteAPI — Note Sharing Implementation Plan

> Add a note sharing system with three endpoints (create share, resolve share, revoke share), a new in-memory share store, share validation helpers, and cascade delete when a note is removed. Seven integration tests verify all required behaviors.

---

## Tasks

### Phase 1: Data Foundation

#### Task 1: Share model and in-memory store
- **Change:** Create `src/models/share.ts` defining the `Share` interface and a `shareStore` object following the exact same Map-based pattern as `noteStore` in `src/models/note.ts`. Implement `getAll()`, `getById(id)`, `create(share)`, `delete(id)`, `deleteByNoteId(noteId)`, and `clear()` methods. Export both the interface and the store.
- **Files:** `src/models/share.ts` (new)
- **Tier:** cheap
- **Done when:** `src/models/share.ts` compiles without errors (`npm run build`); the store exports the Share interface and all six methods.
- **Blockers:** None — established pattern.

#### Task 2: Share validation helper
- **Change:** Add `validateCreateShareInput(body: unknown)` to `src/utils/validation.ts`. Validates: `permission` is required and must be one of `'read' | 'edit' | 'admin'`; `expiresInMinutes` is optional but when present must be a positive integer. Returns discriminated union `{ valid: true; data: { permission, expiresInMinutes? } } | { valid: false; errors: ValidationError[] }` matching the existing pattern.
- **Files:** `src/utils/validation.ts` (modify)
- **Tier:** standard
- **Done when:** Validation correctly rejects invalid permission strings, negative/zero expiry values, and accepts all three permission levels with and without `expiresInMinutes`. Verified via unit tests in Phase 3.
- **Blockers:** None — existing ValidationError type and pattern already in place.

#### VERIFY: Phase 1
- Run `npm run build` — no TypeScript errors
- Run `npm test` — all existing tests pass (0 regressions from adding to validation.ts)
- Confirm `shareStore` exports are callable
- Report: build status, test count, any type errors

---

### Phase 2: API Layer

#### Task 3: Shares router with three endpoints
- **Change:** Create `src/api/shares.ts` implementing:
  - `POST /api/notes/:id/shares` — look up note (404 if missing), validate body via `validateCreateShareInput` (400 if invalid), generate token with `crypto.randomBytes(16).toString('hex')`, compute `expiresAt` as ISO string from `expiresInMinutes` or `null`, call `shareStore.create()`, return `{ shareToken, permission, expiresAt }` with status 201.
  - `GET /api/shares/:token` — look up share by token (404 if missing), check expiry against `Date.now()` (403 if expired), look up note, return full note object with status 200.
  - `DELETE /api/shares/:token` — look up share (404 if missing), call `shareStore.delete()`, return 204.
  Then mount the router in `src/app.ts` using `app.use('/api', sharesRouter)`.
- **Files:** `src/api/shares.ts` (new), `src/app.ts` (modify)
- **Tier:** standard
- **Done when:** All three endpoints return the correct status codes and response bodies for the happy path (verified by Phase 3 tests).
- **Blockers:** `crypto` is a built-in Node.js module — no install needed. Read `src/app.ts` before editing to place the mount correctly.

#### Task 4: Cascade delete shares on note deletion
- **Change:** In `src/api/notes.ts`, import `shareStore` from `src/models/share.ts`. In the `DELETE /api/notes/:id` handler, after confirming the note exists, call `shareStore.deleteByNoteId(id)` before or after `noteStore.delete(id)`.
- **Files:** `src/api/notes.ts` (modify)
- **Tier:** cheap
- **Done when:** Deleting a note via the API results in all shares for that note being removed. Verified by the cascade test in Phase 3.
- **Blockers:** Introduces a cross-module dependency (notes.ts → share model). This is intentional and one-directional — no circular dependency.

#### VERIFY: Phase 2
- Run `npm run build` — no TypeScript errors
- Run `npm test` — all existing tests still pass
- Report: build status, test results, any routing or import issues

---

### Phase 3: Tests

#### Task 5: Integration tests for sharing feature
- **Change:** Create `tests/shares.test.ts` covering all seven required cases:
  1. `POST /api/notes/:id/shares` — 201, returns `shareToken`, `permission`, `expiresAt`
  2. `POST /api/notes/:id/shares` — 404 for unknown note ID
  3. `GET /api/shares/:token` — 200, returns full note object for valid token
  4. `GET /api/shares/:token` — 403 for expired token (inject pre-expired share directly into shareStore with a past `expiresAt`)
  5. `GET /api/shares/:token` — 404 for unknown token
  6. `DELETE /api/shares/:token` — 204, share no longer accessible afterward
  7. Cascade: create a note + share, delete the note, confirm `GET /api/shares/:token` returns 404

  Use `beforeEach` to call both `noteStore.clear()` and `shareStore.clear()`. Follow existing supertest patterns (async/await, `request(app)`).
- **Files:** `tests/shares.test.ts` (new)
- **Tier:** standard
- **Done when:** `npm test` reports all 7 new tests passing alongside the existing tests with no regressions.
- **Blockers:** The expired-token test injects a pre-expired share directly into `shareStore` (using `shareStore.create()` with a past `expiresAt`) to avoid jest timer complexity.

#### VERIFY: Phase 3
- Run `npm test` — all tests pass (existing + 7 new)
- Run `npm run test:coverage` — confirm shares code has meaningful coverage
- Run `npm run lint` — no lint errors
- Report: total test count, coverage percentage for new files, any lint issues

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Expiry comparison off-by-one | 403 returned for shares that should still be valid | Use `Date.now() > new Date(expiresAt).getTime()` (strictly greater than) |
| Token collision | Two shares get the same token | `crypto.randomBytes(16)` gives 128 bits of entropy — collision risk negligible |
| Cascade import introduces circular dependency | Build fails | share.ts imports nothing from notes.ts; dependency is one-directional |
| Expired test flakiness | Test fails depending on timing | Inject pre-expired share directly into shareStore rather than relying on real-time expiry |
| `app.ts` mount order conflict | Share routes shadowed or unreachable | Read app.ts before editing; place shares router after notes router |

## Notes
- Each task should result in a git commit
- Verify tasks are checkpoints — stop and report after each one
- Base branch: main
