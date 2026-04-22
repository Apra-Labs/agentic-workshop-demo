# Note Sharing

Notes can be shared via short-lived, revocable tokens. A share links a note to a cryptographically random token and an optional expiry. Anyone who holds a valid token can read the full note without authentication.

## API

### Create a share

```
POST /api/notes/:id/shares
```

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `permission` | `"read" \| "edit" \| "admin"` | yes | Access level granted by this share |
| `expiresInMinutes` | positive integer | no | Minutes until the share expires; omit for a non-expiring share |

**Response — 201 Created**

```json
{
  "shareToken": "a3f8c2d1e5b04791...",
  "permission": "read",
  "expiresAt": "2026-04-21T14:00:00.000Z"
}
```

`expiresAt` is an ISO 8601 string when `expiresInMinutes` was supplied, or `null` otherwise.

**Error responses**

| Status | Condition |
|---|---|
| 400 | `permission` is missing or invalid; `expiresInMinutes` is not a positive integer |
| 404 | Note with the given `:id` does not exist |

---

### Resolve a share

```
GET /api/shares/:token
```

Returns the full note object (same shape as `GET /api/notes/:id`) for a valid, non-expired share token.

**Error responses**

| Status | Condition |
|---|---|
| 403 | Share exists but its `expiresAt` is in the past |
| 404 | No share with the given `:token` |

---

### Revoke a share

```
DELETE /api/shares/:token
```

Permanently removes the share. Returns **204 No Content**.

**Error responses**

| Status | Condition |
|---|---|
| 404 | No share with the given `:token` |

---

## Data model

```ts
interface Share {
  id: string;             // equals shareToken — the random hex string is the store key
  noteId: string;         // ID of the note this share points to
  permission: 'read' | 'edit' | 'admin';
  expiresAt: string | null; // ISO 8601 UTC, or null for non-expiring shares
  createdAt: string;      // ISO 8601 UTC, set at creation time
}
```

## Design decisions

**`id === shareToken` (O(1) lookup)**
The random token is both the externally visible share link and the primary key in the in-memory Map. This avoids a secondary index and keeps resolution to a single `Map.get()` call. Tokens are generated with `crypto.randomBytes(16).toString('hex')`, giving 128 bits of entropy — collision probability is negligible.

**`expiresAt: string | null` instead of `undefined`**
Using `null` as the sentinel for "no expiry" makes the field always present in API responses and type-safe without optional chaining at call sites. The expiry check is `Date.now() > new Date(expiresAt).getTime()` (strictly greater than), so a share expiring at exactly the current millisecond is still considered valid.

**Cascade delete**
The `DELETE /api/notes/:id` handler calls `shareStore.deleteByNoteId(id)` immediately after the note is removed. This keeps referential integrity in the in-memory store — a resolved share can always find its note, so the `GET /api/shares/:token` handler never needs to handle a missing-note case for valid shares.

## Security

- Tokens are generated with Node's `crypto.randomBytes(16)`, not `Math.random()`, so they are cryptographically unpredictable.
- Expiry is enforced on every `GET` request at the server; there is no way for a client to bypass it by replaying an old token.
- Revoking a share (`DELETE`) is immediate and permanent — there is no soft-delete or grace period.
