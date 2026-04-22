# Note Sharing — Phase 1 Review

**Reviewer:** workshop-rev
**Date:** 2026-04-21 20:44:19-0400
**Verdict:** CHANGES NEEDED

---

## Phase 1 Code Review

**Verdict:** CHANGES NEEDED

### FAIL — Extra `token` field in Share interface

The requirements spec states `id: string; // same as shareToken` — the crypto token IS the ID. Implementation incorrectly added a separate `token` field alongside `id`, plus a `getByToken()` O(n) linear scan method.

**Doer:** fixed in commit `98d01fc` — removed standalone `token` field, removed `getByToken()`, callers use `getById(token)` for O(1) lookup

> See the recent git history of this file to understand the context of this review.

---

## Data Model (src/models/share.ts)

**Check 6 — Share interface fields vs requirements data model: FAIL.**

The requirements specify this data model:

```
interface Share {
  id: string;           // same as shareToken
  noteId: string;
  permission: 'read' | 'edit' | 'admin';
  createdAt: string;
  expiresAt: string | null;
}
```

The comment `// same as shareToken` is the key constraint: the share's `id` IS the cryptographically-generated token. The implementation instead introduces a separate `token: string` field (line 6 of `src/models/share.ts`) that is not in the requirements, and does not establish that `id` equals the token. This has three consequences:

1. **Extra field not in the spec.** The `token` field is an addition to the data model that the requirements do not call for. This means Phase 2 must populate both `id` and `token` when creating a share, and any consumer of the Share type must understand the distinction — added cognitive load with no benefit.

2. **Unnecessary O(n) lookup method.** Because `id` and `token` are separated, the store needs a `getByToken()` method (line 23) that does a linear scan over all shares: `Array.from(shares.values()).find(...)`. If `id` were the token (as specified), `getById(token)` would be an O(1) Map lookup — the same pattern used by `noteStore.getById()`. The `getByToken` method also was not in the plan (Task 1 specifies six methods: getAll, getById, create, delete, deleteByNoteId, clear), so it is unplanned scope.

3. **Ambiguity for Phase 2.** The router in Phase 2 will receive `token` from URL params. With the current design, it must call `getByToken(token)` to find the share, then use `share.id` for deletion. If `id === token`, it simply calls `getById(token)` and `delete(token)` — cleaner, and matching the plan's description in Task 3 ("look up share by token").

**Fix:** Remove the `token` field from the `Share` interface. Remove `getByToken()`. When Phase 2 creates a share, set `id` to `crypto.randomBytes(16).toString('hex')`. All token-based lookups use `getById(token)` directly.

**Check 3 — Will later tasks build cleanly on these abstractions: NOTE.**

Despite the `token` field issue, the store IS functionally sufficient for Phase 2. All six planned methods are present (plus the extra `getByToken`). `deleteByNoteId` correctly iterates and deletes from the Map during iteration, which is safe per the ECMAScript Map iterator spec. `create()`, `delete()`, `getAll()`, and `clear()` follow the `noteStore` pattern exactly.

If the `token` field is removed as recommended, Phase 2 will build more cleanly — `getById` replaces `getByToken`, and the DELETE handler uses the same `id` from the URL param without an intermediate lookup.

**Check 9 — TypeScript types, exports, naming: PASS.**

`SharePermission` type is exported and correctly defined as the union `'read' | 'edit' | 'admin'`. The `Share` interface and `shareStore` are both exported. The `expiresAt: string | null` type (check 7) is correct and explicit — `null` represents no expiry, matching the requirements. `createdAt: string` is present. No TypeScript errors on build (`tsc --noEmit` clean). The `SharePermission` type alias is a good addition — not in the requirements but useful for both the interface and the validation function, keeping the permission values defined in one place.

**Check 1 — Done criteria met: PASS with NOTE.**

Task 1's done criteria: "compiles without errors; the store exports the Share interface and all six methods." The build is clean and all six planned methods are exported. However, the implementation also exports a seventh method (`getByToken`) and an extra interface field (`token`) — both beyond the task scope. The done criteria are technically met, but the implementation over-delivers in a way that deviates from requirements.

---

## Validation Helper (src/utils/validation.ts)

**Check 5 — Requirements alignment: PASS.**

`validateCreateShareInput` validates exactly what the requirements and plan specify: `permission` is required and must be one of `'read' | 'edit' | 'admin'`; `expiresInMinutes` is optional but when present must be a positive integer. The function returns the same discriminated union pattern (`{ valid: true; data } | { valid: false; errors }`) used by `validateCreateInput` and `validateUpdateInput`. The `CreateShareData` interface is properly exported for Phase 2 to consume.

**Check 10 — Security / input validation gaps: PASS.**

The permission validation handles all edge cases correctly:
- `undefined` permission → not in `VALID_PERMISSIONS` array → rejected ✓
- `null` permission → not in array → rejected ✓
- Empty string → not in array → rejected ✓
- Arbitrary strings (`'superadmin'`) → not in array → rejected ✓
- All three valid values → accepted ✓

For `expiresInMinutes`, the check `typeof exp !== 'number' || !Number.isInteger(exp) || exp <= 0` correctly rejects: non-numbers, floats (e.g. `1.5`), zero, negative values, `NaN`, and `Infinity`. This is thorough.

**Check 10 (continued) — `expiresInMinutes: null` edge case: NOTE.**

If a client sends `{ "permission": "read", "expiresInMinutes": null }`, the validator enters the `expiresInMinutes !== undefined` branch (because `null !== undefined` is `true`), then rejects it since `typeof null` is `'object'`. This is arguably correct — the spec says the field is either a positive integer or absent, not explicitly `null`. But some API consumers treat `null` as equivalent to omission for optional fields. This is a stylistic choice, not a bug — just worth noting for Phase 2 documentation. No change required.

**Check 2 — Cohesion and coupling: PASS.**

The validation function imports only `SharePermission` from `src/models/share.ts` — a clean, narrow dependency. The `CreateShareData` type is defined in validation.ts alongside the function that produces it, matching the existing pattern where `validateCreateInput` returns `CreateNoteInput` (defined in note.ts, but that's because it's also used by the model). The `VALID_PERMISSIONS` array is module-scoped, not exported — correct, since it's an implementation detail of the validation function.

**Check 8 — Store methods sufficient for Phase 2 router: PASS.**

Between the store and validation, Phase 2 has everything it needs: `validateCreateShareInput` to validate request bodies, `shareStore.create()` to persist, `shareStore.getById()` (or `getByToken()` until fixed) to resolve tokens, `shareStore.delete()` to revoke, and `shareStore.deleteByNoteId()` for cascade. No modifications to Phase 1 code will be needed in Phase 2 — only consumption.

**Check 4 — Riskiest assumption validated: PASS.**

The build succeeds, confirming the Map-based store pattern extends to shares. The validation function compiles and follows the established discriminated-union pattern. All 21 existing tests pass (8 validation, 13 notes), confirming zero regressions from modifying `validation.ts`.

---

## Summary

**Phase 1 VERIFY results:** Build clean (0 TypeScript errors). Tests: 21 passed, 0 failed, 0 regressions.

**One required change:**

1. **FAIL — `token` field in Share interface.** Remove the `token` field from the `Share` interface and the `getByToken()` method from `shareStore`. The requirements specify `id` is the share token (`id: string; // same as shareToken`). Use `id` as the crypto-generated token and look up shares via `getById(token)` — O(1) Map lookup instead of O(n) scan. This simplifies the data model, removes unplanned scope, and makes Phase 2 integration cleaner.

**Everything else passes:**

- Validation logic is correct and thorough for all specified edge cases
- `expiresAt: string | null` handling is explicit and correct
- Store methods (after fix) are sufficient for Phase 2 without modification
- No TypeScript errors, no test regressions, no security issues
- Pattern consistency with existing `noteStore` and validation functions is strong

**Deferred (not blocking):**

- The `expiresInMinutes: null` rejection is a stylistic choice — document in Phase 2 if relevant
- Previous plan review notes (orphaned share check, explicit null guard on expiry comparison) remain applicable to Phase 2 implementation
