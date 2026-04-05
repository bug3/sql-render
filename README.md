# sql-render

Type-safe `{{variable}}` templating for `.sql` files with built-in injection protection.

- Zero runtime dependencies
- Built-in SQL injection protection
- Custom validators per variable
- Full TypeScript support with generics
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

## API

### Schema-based (recommended)

Define a schema with built-in type validators. Types are inferred automatically.

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

### Available schema types

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

### Generic-based

For simpler cases, you can use an explicit generic type instead of a schema:

```typescript
import { defineQuery } from 'sql-render';

const query = defineQuery<{ table: string; id: number }>('./query.sql');
const { sql } = query({ table: 'users', id: 42 });
```

With optional custom validators per key:

```typescript
const { sql } = query(
  { table: 'prod_users', id: 42 },
  {
    validators: {
      table: (val) => typeof val === 'string' && val.startsWith('prod_'),
    },
  },
);
```

Custom validators **replace** built-in validation for that key (user takes full control).
Single quote escaping still applies to string values.

## Built-in Validation

| Type | Rule | Output |
|------|------|--------|
| `number` | Must be finite (`!isNaN && isFinite`) | `String(value)` |
| `boolean` | Must be `true` or `false` | `"true"` / `"false"` |
| `string` | SQL injection check + escape `'` to `''` | Escaped string |

`null` and `undefined` values are always rejected.

## SQL Injection Protection

String values are checked against built-in patterns:

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

Patterns use word boundaries to avoid false positives (e.g., "backdrop" won't trigger `DROP`).

The pattern list is exported as `SQL_INJECTION_PATTERNS` for reference:

```typescript
import { SQL_INJECTION_PATTERNS } from 'sql-render';
```

## Error Messages

| Scenario | Error |
|----------|-------|
| File not found | `File not found: ./query.sql` |
| Missing params | `Missing variables in params: [tableName, limit]` |
| Extra params | `Extra variables not in template: [foo]` |
| Invalid number | `Validation failed for 'limit': expected a finite number` |
| SQL injection | `SQL injection pattern detected in 'status': value contains forbidden pattern (inline comment)` |
| Custom validator | `Custom validation failed for 'status'` |
| Schema validator | `Schema validation failed for 'status'` |
| Null/undefined | `Validation failed for 'key': value cannot be null or undefined` |

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

MIT
