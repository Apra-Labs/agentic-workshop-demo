# Note Sharing — Plan Review

**Reviewer:** workshop-rev
**Date:** 2026-04-21 20:35:11-0400
**Verdict:** APPROVED

> See the recent git history of this file to understand the context of this review.

---

## 1. Clear "Done" Criteria — PASS

Every task has explicit, verifiable completion criteria. Tasks 1 and 5 are the strongest: Task 1 gates on `npm run build` success and verifiable exports; Task 5 gates on `npm test` passing all 7 new tests with zero regressions. Tasks 2–4 define behavioral criteria ("validation correctly rejects…", "all three endpoints return the correct status codes…") but defer verification to Phase 3 tests. This deferral is acceptable because each phase ends with a VERIFY checkpoint that catches build and regression failures before moving on. A developer would know when each task is complete.

---

## 2. Cohesion and Coupling — PASS

Each task has a single, well-bounded responsibility: Task 1 is the data model, Task 2 is input validation, Task 3 is the HTTP layer, Task 4 is a one-line cross-module side-effect, Task 5 is the test suite. The only coupling across tasks is intentional and one-directional (Tasks 3 and 4 import from Task 1; Task 3 calls Task 2). No task modifies another task's output. Tasks 3 and 4 are independent within Phase 2 — neither requires the other.

---

## 3. Key Abstractions in Earliest Tasks — PASS

The two shared abstractions — the `Share` interface with `shareStore` (Task 1) and `validateCreateShareInput` (Task 2) — are both in Phase 1. Every later task (3, 4, 5) consumes at least one of them. Nothing in Phase 2 or 3 introduces a new shared interface. The layering is correct.

---

## 4. Riskiest Assumption Validated First — PASS

The riskiest foundational assumption is that the Map-based store pattern from `noteStore` extends cleanly to shares, including the non-obvious `deleteByNoteId(noteId)` method needed for cascade deletes. Task 1 validates this immediately with a build check. The next riskiest item — routing integration with `app.ts` — is covered in Task 3's VERIFY checkpoint and explicitly called out in the risk register. Ordering is sound.

---

## 5. Later Tasks Reuse Early Abstractions (DRY) — PASS

Task 3 calls `shareStore.create()`, `shareStore.getById()`, `shareStore.delete()` from Task 1 and `validateCreateShareInput()` from Task 2. Task 4 calls `shareStore.deleteByNoteId()` from Task 1. Task 5 calls `shareStore.clear()` and `shareStore.create()` for test setup. No duplication of store logic or validation in later tasks.

---

## 6. 2–3 Work Tasks per Phase with VERIFY — PASS

Phase 1 has 2 tasks + VERIFY. Phase 2 has 2 tasks + VERIFY. Phase 3 has 1 task + VERIFY. Phase 3 is below the 2–3 target, but the single test task is substantial (7 integration tests covering all endpoints plus the cascade) and would not benefit from artificial splitting. All three VERIFY checkpoints prescribe build, test, and reporting steps. Structure is sound.

---

## 7. Each Task Completable in One Session — PASS

Task 1: one new file following an established pattern (~50 lines). Task 2: one function added to an existing file (~30 lines). Task 3: one new file plus a two-line `app.ts` modification — the largest task but still well-scoped (~80 lines). Task 4: a two-line edit to an existing handler. Task 5: one test file with 7 tests following established supertest patterns (~100 lines). All are single-session work.

---

## 8. Dependencies Satisfied in Order — PASS

Task 1 and 2 have no blockers. Task 3 depends on Task 1 (shareStore) and Task 2 (validation) — both completed in Phase 1 before Phase 2 begins. Task 4 depends on Task 1 (shareStore.deleteByNoteId) — also completed in Phase 1. Task 5 depends on all of Tasks 1–4, which are all complete before Phase 3. Within Phase 2, Tasks 3 and 4 are independent of each other — no ordering constraint between them. No dependency violations.

---

## 9. Ambiguous Tasks — PASS with NOTE

**NOTE — Task 3 routing design:** The plan mounts the shares router at `/api` with routes `/notes/:id/shares` and `/shares/:token` in a single router. This is a valid but somewhat unusual pattern — a single router handling two different path prefixes. The plan is explicit enough about the mount point (`app.use('/api', sharesRouter)`) that two developers should arrive at the same result. The risk register correctly flags the mount-order dependency.

**NOTE — Task 1 interface fields:** The plan says "defining the Share interface" but does not list the fields (id, noteId, permission, createdAt, expiresAt). These are specified in `requirements.md`, so the implementer can derive them, but a self-contained plan would enumerate the fields directly. Low risk — the requirements are unambiguous.

**NOTE — Task 3 Share object construction:** The plan describes generating the token and computing expiresAt, but does not explicitly mention setting `createdAt`, `id` (= token), and `noteId` (= req.params.id) when constructing the Share object for `shareStore.create()`. An experienced developer would infer these, but spelling them out would eliminate any doubt.

---

## 10. Hidden Dependencies — PASS

No hidden dependencies found. Tasks 3 and 4 within Phase 2 are truly independent. Task 5 correctly depends on all prior tasks. The cross-module dependency in Task 4 (notes.ts importing from share.ts) is explicitly acknowledged and confirmed one-directional. The `crypto` module used in Task 3 is a Node.js built-in — no install dependency. The VERIFY checkpoints catch regressions from modifications to existing files (validation.ts in Task 2, notes.ts in Task 4, app.ts in Task 3).

---

## 11. Risk Register — PASS with NOTE

The risk register covers five risks with concrete mitigations. All five are legitimate and the mitigations are sound (especially the pre-expired share injection for test flakiness and the strictly-greater-than comparison for expiry).

**Two additional risks not in the register:**

1. **Orphaned share on GET resolve.** If a share exists but its parent note has been deleted without cascade (e.g., direct store manipulation in tests, or a cascade bug), `GET /api/shares/:token` would call `noteStore.getById(noteId)` and get `undefined`, then pass it to `res.json()`. This produces a `200` with a `null`/empty body — confusing behavior. Mitigation: Task 3's GET handler should check the note lookup result and return 404 if the note is gone. In practice, cascade delete (Task 4) makes this near-impossible in normal API usage, so this is low-severity.

2. **Null expiresAt in expiry check.** When a share has no expiry (`expiresAt: null`), the comparison `Date.now() > new Date(null).getTime()` evaluates to `Date.now() > NaN`, which is `false` — correctly passing the check. But this relies on NaN comparison semantics rather than an explicit null guard. A future developer might refactor the comparison and break it. Mitigation: add an explicit `if (share.expiresAt !== null)` guard before the date comparison. Low-severity but worth documenting.

---

## 12. Requirements Alignment — PASS

The plan covers every requirement in `requirements.md`:
- All three endpoints (POST create, GET resolve, DELETE revoke) with correct paths, status codes, and response shapes
- The Share data model with in-memory store
- Cascade delete on note removal
- All seven required test cases, each mapped 1:1 to the requirements list
- Cryptographic token generation via `crypto.randomBytes`

No requirements are missed, and no scope is added beyond what is needed (the `deleteByNoteId` store method is a necessary implementation detail for cascade, not scope creep).

---

## Summary

The plan **passes all 12 checks**. It is well-structured with correct phasing, proper dependency ordering, clear done criteria, and a solid risk register. Three notes for the implementer to be aware of:

1. **Orphaned share edge case** — the GET /api/shares/:token handler should defensively check that the note still exists after looking up the share, returning 404 if not. This isn't in the plan but is cheap to add during Task 3.
2. **Null expiresAt guard** — use an explicit null check before the date comparison rather than relying on NaN semantics.
3. **Share object construction** — Task 3 should set all Share interface fields (id, noteId, permission, createdAt, expiresAt) when calling shareStore.create().

None of these rise to CHANGES NEEDED — they are implementation-time clarifications, not structural plan defects. The plan is ready to execute.
