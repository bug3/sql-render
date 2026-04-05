# sql-render

Type-safe `{{variable}}` templating for `.sql` files with built-in injection protection.

- Zero runtime dependencies
- Built-in SQL injection protection
- Schema-based validation with type inference
- Custom schema types for project-specific rules
- Works with any SQL engine (Athena, Trino, PostgreSQL, MySQL, etc.)

## Installation

```bash
npm install sql-render
```

## Quick Start

Create a SQL file with `{{variable}}` placeholders:

```sql
-- queries/getEvents.sql
SELECT event_id, event_name
FROM {{tableName}}
WHERE status = '{{status}}'
  AND created_at >= '{{startDate}}'
ORDER BY {{orderBy}}
LIMIT {{limit}}
```

Define and use the query in TypeScript:

```typescript
import { defineQuery } from 'sql-render';

const getEvents = defineQuery<{
  tableName: string;
  status: string;
  startDate: string;
  orderBy: string;
  limit: number;
}>('./queries/getEvents.sql');

const { sql } = getEvents({
  tableName: 'prod_events',
  status: 'active',
  startDate: '2024-01-01',
  orderBy: 'created_at',
  limit: 100,
});
```

Result:

```sql
SELECT event_id, event_name
FROM prod_events
WHERE status = 'active'
  AND created_at >= '2024-01-01'
ORDER BY created_at
LIMIT 100
```

## Schema Validation

For stricter validation, define a schema instead of a generic type. Types are inferred automatically.

```typescript
import { defineQuery, schema } from 'sql-render';

const getEvents = defineQuery('./queries/getEvents.sql', {
  tableName: schema.identifier,
  status: schema.enum('active', 'pending', 'done'),
  startDate: schema.isoDate,
  orderBy: schema.identifier,
  limit: schema.positiveInt,
});

const { sql } = getEvents({
  tableName: 'prod_events',
  status: 'active',
  startDate: '2024-01-01',
  orderBy: 'created_at',
  limit: 100,
});
```

### Available Schema Types

| Type | Format | Example |
|------|--------|---------|
| `schema.string` | Any string (with SQL injection check) | `'hello'` |
| `schema.number` | Finite number | `42`, `3.14` |
| `schema.boolean` | `true` / `false` | `true` |
| `schema.isoDate` | `YYYY-MM-DD` | `'2026-04-01'` |
| `schema.isoTimestamp` | ISO 8601 with timezone | `'2026-04-01T13:57:34.000Z'` |
| `schema.identifier` | SQL identifier (up to `db.schema.table`) | `'public.users'` |
| `schema.uuid` | RFC 4122 UUID | `'550e8400-e29b-41d4-a716-446655440000'` |
| `schema.positiveInt` | Positive integer | `100` |
| `schema.enum(...)` | Whitelist of allowed values | `schema.enum('asc', 'desc')` |
| `schema.s3Path` | S3 URI | `'s3://bucket/path/'` |

### Custom Schema Types

Define your own type descriptors for project-specific validation:

```typescript
import { defineQuery, schema } from 'sql-render';

const prodTable = {
  validate: (val: unknown) => typeof val === 'string' && val.startsWith('prod_'),
};

const query = defineQuery('./query.sql', {
  table: prodTable,
  startDate: schema.isoDate,
  limit: schema.positiveInt,
});
```

A type descriptor is any object with a `validate(val: unknown) => boolean` method.

## SQL Injection Protection

`schema.string` and the generic `string` type check values against built-in patterns:

| Pattern | Examples |
|---------|----------|
| Comments | `--`, `/*`, `*/` |
| Statement separator | `;` |
| DDL commands | `DROP`, `ALTER`, `TRUNCATE`, `CREATE` |
| UNION injection | `UNION SELECT`, `UNION ALL SELECT` |
| DML commands | `INSERT INTO`, `DELETE FROM`, `UPDATE ... SET` |
| Execution | `EXEC`, `EXECUTE` |
| Time-based | `SLEEP()`, `BENCHMARK()`, `WAITFOR DELAY` |
| System procedures | `xp_*`, `sp_*` |
| Privilege commands | `GRANT`, `REVOKE` |
| File operations | `LOAD_FILE()`, `INTO OUTFILE`, `INTO DUMPFILE` |
| Data loading | `LOAD DATA` |

Patterns use word boundaries to avoid false positives (e.g., "backdrop" won't trigger `DROP`).

Other schema types like `schema.identifier`, `schema.isoDate`, `schema.uuid` etc. are inherently safe due to their strict format validation.

The pattern list is exported for reference:

```typescript
import { SQL_INJECTION_PATTERNS } from 'sql-render';
```

## Error Messages

| Scenario | Error |
|----------|-------|
| File not found | `File not found: ./query.sql` |
| Schema mismatch | `Schema missing definitions for template variables: [id]` |
| Missing params | `Missing variables in params: [tableName, limit]` |
| Extra params | `Extra variables not in template: [foo]` |
| Schema validation | `Schema validation failed for 'status'` |
| Type validation | `SQL injection pattern detected in 'status': ...` |
| Null/undefined | `Validation failed for 'key': value cannot be null or undefined` |
| Invalid descriptor | `Invalid schema descriptor for 'key': must have a validate(val) method` |

## Security Model

sql-render protects against SQL injection using a **denylist + escape** strategy — not parameterized queries (prepared statements). Values are validated and escaped before being interpolated directly into the SQL string.

This is effective for engines that don't support parameterized queries (e.g., Athena, Trino DDL, ad-hoc SQL scripts). If your database driver supports parameterized queries, prefer using them as the primary defense and treat sql-render's protection as an additional layer.

## sql-formatter Compatibility

The `{{variable}}` syntax works with [sql-formatter](https://github.com/sql-formatter-org/sql-formatter) (Trino dialect):

```json
{
  "language": "trino",
  "keywordCase": "upper",
  "paramTypes": {
    "custom": [{ "regex": "\\{\\{[a-zA-Z_][a-zA-Z0-9_]*\\}\\}" }]
  }
}
```

## License

[MIT](https://github.com/bug3/sql-render/blob/master/LICENSE)
