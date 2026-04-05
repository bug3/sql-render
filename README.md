# sql-render

TypeScript-first SQL templating library. Load SQL files with `{{variable}}` syntax, validate parameters by type, and render safe SQL strings.

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

### `defineQuery<T>(filePath: string)`

Loads a SQL file, parses `{{variable}}` tokens, and returns a render function.

- **filePath** — path to the `.sql` file (relative paths resolve from `process.cwd()`)
- **T** — generic type defining the expected parameter shape

Returns a function: `(params: T, options?: QueryOptions<T>) => { sql: string }`

### Options

```typescript
const { sql } = getEvents(
  { tableName: 'prod_events', status: 'active', startDate: '2024-01-01', orderBy: 'created_at', limit: 100 },
  {
    validators: {
      tableName: (val) => typeof val === 'string' && val.startsWith('prod_'),
      status: (val) => typeof val === 'string' && /^[a-z]+$/.test(val),
    },
  },
);
```

#### Custom Validators

- Defined per variable key
- Receive the raw value as argument, return `boolean`
- When provided, **replace** built-in validation for that key (user takes full control)
- Single quote escaping still applies to string values

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
