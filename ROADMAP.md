# Roadmap

## v0.2

- [ ] **Inline template support** - Allow passing SQL strings directly without requiring a `.sql` file, reducing boilerplate for short one-off queries
- [ ] **Export rendered SQL to file** - Add an option to write the rendered SQL to a file for debugging and audit purposes
- [ ] **TypeDescriptor `description` field** - Add an optional `description` property to `TypeDescriptor` so schema validation errors can display the expected format (e.g. `Expected: ISO date YYYY-MM-DD`)

## Maybe

- [ ] **Template caching** - Cache loaded templates in a `Map` to avoid redundant `readFileSync` calls when `defineQuery` is used outside module scope
- [ ] **Conditional blocks / IN-list expansion** - Support optional WHERE clauses (`{{#if}}`) and array expansion (`WHERE id IN ({{ids}})`). Would change the library's templating nature significantly - evaluate only if `.sql` file duplication becomes a real pain point
- [ ] **Async `loadTemplate`** - Non-blocking file reads for server environments (Express, Fastify). Not needed for current Lambda/script use cases
- [ ] **Query execution integration** - Return parameterized output or integrate with Athena SDK. Intentionally out of scope to preserve single responsibility - better suited as a separate package
- [ ] **Parameterized output mode** - Return `{ sql: string, params: unknown[] }` with `$1, $2` placeholders for engines that support it. Not applicable to Athena but could broaden adoption
- [ ] **Allowlist approach for `schema.string`** - Require a regex allowlist instead of relying on the denylist. Already achievable via custom schema types, so built-in support is low priority
