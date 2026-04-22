# Architecture

## In-memory store pattern

Both notes and shares use the same Map-backed store pattern: a private `Map<string, T>` closed over in the module, exposed through a named export (`noteStore`, `shareStore`) with typed methods — `getAll`, `getById`, `create`, `delete`, `clear`, and any domain-specific methods. Each store owns its Map; no store reaches into another store's Map directly.

This pattern keeps stores swappable: replacing the Map with a database client requires changing only the store module — the router code that calls store methods stays untouched.

## Dependency graph

```
src/api/notes.ts  →  src/models/note.ts
                  →  src/models/share.ts   (cascade delete only)
                  →  src/utils/validation.ts

src/api/shares.ts →  src/models/note.ts
                  →  src/models/share.ts
                  →  src/utils/validation.ts

src/models/share.ts  (no imports from other project modules)
src/models/note.ts   (no imports from other project modules)
```

The `notes` router imports `shareStore` for cascade delete, but `share.ts` imports nothing from `notes.ts`. The dependency is strictly one-directional, so there is no circular import risk.

## Validation pattern

All input validation uses a discriminated union return type:

```ts
{ valid: true; data: T } | { valid: false; errors: ValidationError[] }
```

Validators live in `src/utils/validation.ts` and are the only place that touches raw `unknown` request bodies. Routers call the validator, branch on `result.valid`, and either send a `400` with `result.errors` or proceed with the typed `result.data`. No inline validation logic appears in route handlers.

`validateCreateShareInput` follows the same structure as `validateCreateInput` and `validateUpdateInput`, making the pattern uniform across all three resource types.
