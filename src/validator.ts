export const SQL_INJECTION_PATTERNS: { name: string; regex: RegExp }[] = [
    { name: 'inline comment', regex: /--/ },
    { name: 'block comment open', regex: /\/\*/ },
    { name: 'block comment close', regex: /\*\// },
    { name: 'statement separator', regex: /;/ },
    { name: 'DDL command', regex: /\b(DROP|ALTER|TRUNCATE|CREATE)\b/i },
    { name: 'UNION injection', regex: /\bUNION\s+(ALL\s+)?SELECT\b/i },
    { name: 'INSERT', regex: /\bINSERT\s+INTO\b/i },
    { name: 'DELETE', regex: /\bDELETE\s+FROM\b/i },
    { name: 'UPDATE', regex: /\bUPDATE\s+\S+\s+SET\b/i },
    { name: 'EXEC', regex: /\b(EXEC|EXECUTE)\b/i },
    { name: 'time-based injection', regex: /\b(SLEEP|BENCHMARK)\s*\(/i },
    { name: 'WAITFOR', regex: /\bWAITFOR\s+DELAY\b/i },
    { name: 'system procedure', regex: /\b(xp_|sp_)\w+/i },
];

export function escapeValue(value: unknown): string {
    if (typeof value === 'string') {
        return value.replace(/'/g, "''");
    }
    return String(value);
}
