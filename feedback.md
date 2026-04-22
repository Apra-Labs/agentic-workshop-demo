# Note Sharing — Final Review (All Phases)

**Reviewer:** workshop-rev
**Date:** 2026-04-21 20:59:46-0400
**Verdict:** APPROVED

> See the recent git history of this file to understand the context of this review.

---

## Test Suite (tests/shares.test.ts)

### Test 1: POST creates share — returns 201 with shareToken, permission, expiresAt — PASS

Creates a note via the API, then POSTs to `/api/notes/:id/shares` with `{ permission: "read" }`. Asserts 201, verifies `shareToken` is defined, `permission` is `"read"`, and `expiresAt` key exists on the response body. The `hasOwnProperty` check is a deliberate choice over a truthiness check — it correctly handles the `null` value case (no `expiresInMinutes` was sent, so `expiresAt` should be `null`). Minor note: the test doesn't assert `expiresAt === null` explicitly, but key-presence is sufficient for the requirement. The test also exercises the null-expiresAt code path in the handler (line 25-26 of shares.ts), which is a meaningful coverage contribution.

### Test 2: POST returns 404 for unknown note ID — PASS

POSTs to a non-existent note ID (`"does-not-exist"`). Asserts 404. Clean, minimal, correct. Exercises the note-existence guard on line 11-14 of shares.ts.

### Test 3: GET returns 200 with full note object for valid token — PASS

End-to-end: creates a note with a tag, creates a share, then GETs via the share token. Asserts 200, verifies the response contains the note's `id`, `title`, and `content`. This proves the full resolution chain: token lookup → expiry check (null expiresAt, passes through) → note lookup → note returned. The tag in the note creation (`["tag1"]`) is a good touch — it ensures the full note object is returned, not a stripped-down projection.

### Test 4: GET returns 403 for expired token — PASS

Creates a note via the API, then injects a pre-expired share directly into `shareStore.create()` with `expiresAt: new Date(Date.now() - 60000).toISOString()` — 60 seconds in the past. This avoids jest timer complexity entirely, as specified in the plan. The token is a hardcoded string (`"expired-token-abc123"`), which is fine for test isolation since `beforeEach` clears both stores. Asserts 403. Exercises the expiry guard on line 47-49 of shares.ts.

### Test 5: GET returns 404 for unknown token — PASS

GETs a nonexistent token. Asserts 404. Exercises the token-existence guard on lines 42-45 of shares.ts. Minimal and correct.

### Test 6: DELETE revokes share and returns 204 — PASS

Creates a note and share, DELETEs the share, asserts 204. Then GETs the same token and asserts 404, proving the revocation is durable. This double-tap pattern (delete then verify) is stronger than just checking the status code — it confirms the share was actually removed from the store, not just acknowledged.

### Test 7: Cascade — deleting note removes its shares — PASS

Creates a note and share, deletes the note via `DELETE /api/notes/:id`, then GETs the share token and asserts 404. This exercises the cascade wiring in `src/api/notes.ts:89` (`shareStore.deleteByNoteId`). Uses the `"admin"` permission level, which provides variety across the test suite (test 1 uses `"read"`, test 6 uses `"edit"`, test 7 uses `"admin"` — all three permission values are exercised).

### Test Infrastructure — PASS

`beforeEach` (lines 6-9) clears both `noteStore` and `shareStore` before every test, ensuring full isolation. All tests use the async/await supertest pattern (`await request(app).method(...)`) consistent with the existing `tests/notes.test.ts`. Imports are clean — `app`, `noteStore`, and `shareStore` are all used.

### Coverage Assessment

Coverage for `src/api/shares.ts`: 85.36% statements, 60% branches, 100% functions. Uncovered lines:
- Lines 18-19: validation error path (400 response when `validateCreateShareInput` returns invalid) — not in the 7 required tests. Validation logic itself is tested in `tests/validation.test.ts` for notes, and the share validator follows the same pattern. Acceptable gap.
- Lines 54-55: orphaned note path (note deleted between share creation and resolution, bypassing cascade) — defensive guard for an unlikely scenario with in-memory stores. Acceptable gap.
- Lines 64-65: DELETE 404 for unknown token — the endpoint handles it, but this specific status code isn't in the 7 required tests. Acceptable gap.

None of these gaps represent missing required test cases. The 7 required tests are all present, all correct, and all pass.

---

## Full Feature Assessment (Phases 1–3)

### Requirements Coverage — COMPLETE

Every acceptance criterion from requirements.md is satisfied:

| Requirement | Status | Verified By |
|-------------|--------|-------------|
| POST /api/notes/:id/shares creates share, returns token | PASS | Test 1 + code review |
| POST returns 404 for missing note | PASS | Test 2 |
| Token uses crypto.randomBytes | PASS | shares.ts:22 — `crypto.randomBytes(16).toString("hex")` |
| GET /api/shares/:token returns full note | PASS | Test 3 |
| GET returns 403 for expired token | PASS | Test 4 |
| GET returns 404 for unknown token | PASS | Test 5 |
| DELETE /api/shares/:token revokes, returns 204 | PASS | Test 6 |
| DELETE returns 404 for unknown token | PASS | shares.ts:63-66 (handler logic; not explicitly tested) |
| Cascade: deleting note deletes all its shares | PASS | Test 7 |
| Share data model: id, noteId, permission, expiresAt, createdAt | PASS | share.ts interface |
| In-memory store (same pattern as noteStore) | PASS | Map-based store in share.ts |

### Regressions — NONE

28 tests pass: 21 pre-existing (8 validation, 11 notes, 1 health check, 1 edge case) + 7 new share tests. All 3 test suites green. No test was modified — only additions.

### Lint — CLEAN

`eslint src/ tests/ --ext .ts` — 0 errors, 0 warnings.

### Build — CLEAN

`tsc` — 0 errors. All new files compile without issues.

### Security — PASS

- **Token generation:** `crypto.randomBytes(16)` produces 128 bits of cryptographic entropy. Collision probability negligible (~2^-64 for birthday attack at scale far beyond in-memory use).
- **Expiry comparison:** `Date.now() > new Date(share.expiresAt).getTime()` — strictly greater-than, as documented in the risk register. No off-by-one.
- **Error responses:** All use `{ error: "message" }` format. No raw error objects, no stack traces, no internal state leakage.
- **No `console.log`** in any handler.
- **No `any` types** — proper TypeScript interfaces throughout (`Share`, `SharePermission`, `CreateShareData`, `ValidationError`).
- **No circular dependencies:** `notes.ts → share model` is one-directional. `shares.ts → note model` and `shares.ts → share model` are both one-directional. No cycles.

### Correctness — PASS

- Validation helper correctly rejects invalid permission strings and non-positive-integer expiry values, following the same discriminated union pattern as existing validators.
- The `deleteByNoteId` iteration-during-deletion is safe per ECMAScript Map spec.
- The `expiresAt` null check (`share.expiresAt !== null`) correctly allows non-expiring shares to pass through without triggering the 403.
- The defensive note-existence check in GET `/api/shares/:token` (lines 52-55 of shares.ts) handles the orphaned-share edge case gracefully.
- Router mounting order in app.ts is correct: `/api/notes` (more specific) before `/api` (broader). No route shadowing.

### Maintainability — GOOD

- New files follow established patterns exactly: Map-based store, discriminated union validation, Express router with typed params, supertest integration tests.
- Code is clean, consistent, and well-structured. Early returns keep handlers flat.
- No unnecessary abstractions or over-engineering. The feature is self-contained across 4 new/modified source files and 1 test file.

---

## Summary

**APPROVED.** All 7 required integration tests are present, correct, and passing. The complete feature (share model, validation, 3 endpoints, cascade delete, tests) satisfies every acceptance criterion from requirements.md. 28/28 tests pass with 0 regressions. Build and lint are clean. No security, correctness, or maintainability issues found.

Deferred to backlog (not blocking):
- Test coverage for the POST validation error path (400), the orphaned-note path, and the DELETE 404 path — all are handled in code but not covered by the 7 required tests.
- The first test could assert `expiresAt === null` explicitly for slightly stronger validation of the null-expiry path.
