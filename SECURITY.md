# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it privately via [GitHub Security Advisories](https://github.com/bug3/sql-render/security/advisories/new).

Do not open a public issue for security vulnerabilities.

## Security Model

sql-render uses a denylist + escape strategy for SQL injection protection, not parameterized queries. This is by design for engines that lack parameterized query support (e.g. Athena, Trino DDL). See the [README](README.md#security-model) for details.
