# Note Sharing — Phase 2 Review

**Reviewer:** workshop-rev
**Date:** 2026-04-21 21:05:00-0400
**Verdict:** APPROVED

> See the recent git history of this file to understand the context of this review.

---

## Shares Router (src/api/shares.ts)

### POST /api/notes/:id/shares — PASS

The handler correctly validates note existence first (404 if missing), then validates the request body via `validateCreateShareInput` (400 if invalid), then generates a token with `crypto.randomBytes(16).toString('hex')` — 128 bits of cryptographic entropy. The `expiresAt` computation uses `Date.now() + minutes * 60 * 1000` with the `!= null` guard, producing an ISO string or `null`. The response is status 201 with all three required fields: `shareToken`, `permission`, `expiresAt`. The `id` field in the created share is set to the token, consistent with the Phase 1 data model fix (`id === shareToken`). Early returns keep the happy path clean.

### GET /api/shares/:token — PASS

Token lookup uses `shareStore.getById(req.params.token)` — O(1) Map lookup as designed. The 404 for unknown tokens is correct. The expiry check on line 47 uses `Date.now() > new Date(share.expiresAt).getTime()` — strictly greater-than as required by the risk register, with a `!== null` guard so non-expiring shares pass through. The 403 message is generic ("Share has expired") — no information leakage about the underlying note.

The defensive check on lines 52–55 handles the orphaned-share edge case: if a note was deleted after a share was created (without cascade — e.g., via direct store manipulation in tests), the handler returns 404 with "Note not found" rather than crashing. This was flagged as a deferred concern in the Phase 1 review and is now properly addressed.

### DELETE /api/shares/:token — PASS

Lookup-then-delete pattern with 404 for unknown tokens. Returns 204 with `.send()` (no body), which is correct for No Content — `.json()` would be wrong here. Consistent with the existing `DELETE /api/notes/:id` handler pattern.

### Security — PASS

- Token generation: `crypto.randomBytes(16)` — cryptographically secure, 128-bit entropy, negligible collision risk
- No raw error objects leaked — all responses use `{ error: "message" }` format
- Error messages are generic — no internal state or stack traces exposed
- No `console.log` in handlers
- No `any` types — proper TypeScript interfaces throughout

---

## Router Mounting (src/app.ts) — PASS

The shares router is mounted at `app.use('/api', sharesRouter)` after the notes router at `app.use('/api/notes', notesRouter)`. This produces the correct effective routes:

- `POST /api/notes/:id/shares` — no conflict with notesRouter because `/:id` in notesRouter does not match the extra `/shares` path segment
- `GET /api/shares/:token` — clean path under `/api`
- `DELETE /api/shares/:token` — clean path under `/api`

Mount order is correct: notesRouter first (more specific prefix), sharesRouter second (broader `/api` prefix). No route shadowing.

---

## Cascade Delete (src/api/notes.ts) — PASS

Line 89: `shareStore.deleteByNoteId(req.params.id)` is called after `noteStore.delete()` succeeds and before the 204 response. The placement is correct — cascade only runs when the note actually existed and was deleted (the `if (!deleted)` guard returns 404 earlier). The import of `shareStore` from `../models/share` is a one-directional dependency (notes → share model) with no circular reference, as noted in the plan's risk register.

The `deleteByNoteId` implementation in the store iterates the Map and deletes matching entries — safe per the ECMAScript spec for Map iteration during deletion.

---

## Cumulative Phase 1+2 Assessment

Phase 1 findings remain intact:

- **Share interface:** 5 fields (`id`, `noteId`, `permission`, `expiresAt`, `createdAt`) — no extra `token` field. The fix from commit `0420d76` holds. ✓
- **Store methods:** 6 methods (`getAll`, `getById`, `create`, `delete`, `deleteByNoteId`, `clear`) — no extra `getByToken`. ✓
- **Validation helper:** `validateCreateShareInput` unchanged from Phase 1 review — correctly validates permission enum and optional positive-integer expiry. ✓
- **Build:** `tsc` — 0 errors ✓
- **Lint:** `eslint` — 0 errors ✓
- **Tests:** 21 passed, 0 failed, 0 regressions ✓

The Phase 1 deferred notes are resolved:
- Orphaned share check: addressed by the defensive `noteStore.getById` check in the GET handler (lines 52–55)
- Explicit null guard on expiry: addressed by `share.expiresAt !== null` check (line 47)

---

## Summary

All 12 review checks pass. The three endpoints implement the requirements exactly: POST creates shares with crypto tokens and returns 201, GET resolves tokens with correct expiry enforcement (strictly greater-than) and orphan defense, DELETE revokes shares with 204. Cascade delete is correctly wired. Router mounting has no conflicts. No TypeScript errors, no lint errors, no security issues, no regressions.

Phase 2 is ready for Phase 3 (integration tests).
