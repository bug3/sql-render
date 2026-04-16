# sql-render

[![CI](https://github.com/bug3/sql-render/actions/workflows/ci.yml/badge.svg)](https://github.com/bug3/sql-render/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/sql-render)](https://www.npmjs.com/package/sql-render)
[![license](https://img.shields.io/npm/l/sql-render)](LICENSE)
[![node](https://img.shields.io/node/v/sql-render)](package.json)

Type-safe `{{variable}}` templating for `.sql` files with built-in injection protection.

- Zero runtime dependencies
- Built-in SQL injection protection
- Schema-based validation with type inference
- Custom schema types for project-specific rules
- Works with SQL engines that treat backslash as literal in strings (Athena, Trino, PostgreSQL)
- Compatible with [sql-formatter](https://github.com/sql-formatter-org/sql-formatter)

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
  startDate: '2022-02-22',
  orderBy: 'created_at',
  limit: 99,
});
```

Result:

```sql
SELECT
  event_id,
  event_name
FROM
  prod_events
WHERE
  status = 'active'
  AND created_at >= '2022-02-22'
ORDER BY
  created_at
LIMIT
  99
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
  startDate: '2022-02-22',
  orderBy: 'created_at',
  limit: 99,
});
```

### Available Schema Types

| Type | Format | Example |
|------|--------|---------|
| `schema.string` | Any string (with SQL injection check) | `'hello'` |
| `schema.number` | Finite number | `33`, `3.14` |
| `schema.boolean` | `true` / `false` | `true` |
| `schema.isoDate` | `YYYY-MM-DD` | `'2022-02-22'` |
| `schema.isoTimestamp` | ISO 8601 with timezone | `'2022-02-22T22:02:22.000Z'` |
| `schema.identifier` | SQL identifier (up to `db.schema.table`) | `'public.users'` |
| `schema.uuid` | UUID hex format (8-4-4-4-12) | `'550e8400-e29b-41d4-a716-446655440000'` |
| `schema.positiveInt` | Positive integer | `100` |
| `schema.enum(...)` | Whitelist of allowed values | `schema.enum('asc', 'desc')` |
| `schema.s3Path` | S3 URI | `'s3://athena-results/queries/'` |

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
| Schema validation | `Schema validation failed for 'status': received string ("invalid")` |
| Type validation | `SQL injection pattern detected in 'status': ...` |
| Null/undefined | `Validation failed for 'key': value cannot be null or undefined` |
| Invalid descriptor | `Invalid schema descriptor for 'key': must have a validate(val) method` |

## Security Model

sql-render protects against SQL injection using a **denylist + escape** strategy, not parameterized queries (prepared statements). Values are validated and escaped before being interpolated directly into the SQL string.

This is effective for engines that don't support parameterized queries (e.g., Athena, Trino DDL, ad-hoc SQL scripts). If your database driver supports parameterized queries, prefer using them as the primary defense and treat sql-render's protection as an additional layer.

The built-in denylist does not guarantee 100% protection against all SQL injection vectors. For stricter control, define [custom schema types](#custom-schema-types) tailored to your project's specific validation needs.

To report a vulnerability, see [SECURITY.md](SECURITY.md).

## sql-formatter Compatibility

The `{{variable}}` syntax is fully compatible with [sql-formatter](https://github.com/sql-formatter-org/sql-formatter). A `paramTypes` custom regex is required so that `{{variables}}` containing SQL keywords (e.g. `{{limit}}`) are treated as parameters instead of being parsed as SQL.

### VS Code

Install the [SQL Formatter VSCode](https://marketplace.visualstudio.com/items?itemName=ReneSaarsoo.sql-formatter-vsc) extension, then copy [`.vscode/settings.json`](.vscode/settings.json) into your project to enable format-on-save with the recommended settings:

```json
{
    "[sql]": {
        "editor.defaultFormatter": "ReneSaarsoo.sql-formatter-vsc",
        "editor.formatOnSave": true
    },
    "SQL-Formatter-VSCode.dialect": "trino",
    "SQL-Formatter-VSCode.keywordCase": "upper",
    "SQL-Formatter-VSCode.functionCase": "upper",
    "SQL-Formatter-VSCode.dataTypeCase": "upper",
    "SQL-Formatter-VSCode.paramTypes": {
        "custom": [{ "regex": "\\{\\{[a-zA-Z_][a-zA-Z0-9_]*\\}\\}" }]
    }
}
```

## For LLMs

Two machine-readable summaries are maintained for AI consumption, following the [llms.txt](https://llmstxt.org) convention:

- [llms.txt](llms.txt) - curated API reference and usage guide
- [llms-full.txt](llms-full.txt) - full packed source, auto-generated on each push

## License

[MIT](https://github.com/bug3/sql-render/blob/master/LICENSE)
