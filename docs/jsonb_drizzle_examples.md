# JSONB and Drizzle — Examples and Patterns

This short guide shows recommended PostgreSQL `jsonb` usage patterns and Drizzle-compatible snippets for `properties`/`metadata` fields.

1) Containment query (fast with GIN index)

```sql
-- SQL
SELECT * FROM entities WHERE properties @> '{"confidence": 0.85}';
```

Drizzle (using raw SQL expression):

```ts
import { sql } from 'drizzle-orm';

const results = await db.select().from(entities).where(sql`properties @> ${JSON.stringify({ confidence: 0.85 })}::jsonb`);
```

2) Extract scalar for ordering or comparisons

```sql
SELECT *, (properties->>'confidence')::numeric as confidence_num FROM entities ORDER BY confidence_num DESC;
```

Drizzle (example):

```ts
const results = await db
  .select()
  .from(entities)
  .orderBy(sql`((properties->>'confidence')::numeric) DESC`);
```

3) Partial merge (merge new keys without overwriting existing JSONB)

SQL:

```sql
UPDATE entities
SET properties = properties || '{"lastSeen": "2025-12-14"}'::jsonb
WHERE id = 123;
```

Drizzle (use `sql` for `||` operator):

```ts
const newProps = { lastSeen: new Date().toISOString() };
await db.update(entities)
  .set({ properties: sql`properties || ${JSON.stringify(newProps)}::jsonb` })
  .where(eq(entities.id, 123));
```

4) Nested updates with `jsonb_set`

SQL:

```sql
UPDATE entities
SET properties = jsonb_set(properties, '{nested,score}', '0.9', true)
WHERE id = 123;
```

Drizzle (raw):

```ts
await db.execute(sql`UPDATE entities SET properties = jsonb_set(properties, '{nested,score}', ${JSON.stringify('0.9')}, true) WHERE id = ${123}`);
```

5) Best practices
- Create a GIN index on `properties` for fast containment: `CREATE INDEX CONCURRENTLY idx_entities_properties_gin ON entities USING gin (properties);`
- For frequently queried scalar keys, add an expression index or a stored generated column and index it (e.g., `confidence`).
- Don’t `JSON.stringify` objects before passing to Drizzle/pg — pass native JS objects when inserting or use `sql` with explicit `::jsonb` casts for expressions.

6) Caveats
- If you use `CONCURRENTLY` for index creation, run that command outside of explicit transactions.
- Validate and normalize keys before indexing (e.g., ensure `confidence` is always numeric or absent).
