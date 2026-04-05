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

function detectSqlInjection(key: string, value: string): void {
    for (const pattern of SQL_INJECTION_PATTERNS) {
        if (pattern.regex.test(value)) {
            throw new Error(
                `SQL injection pattern detected in '${key}': value contains forbidden pattern (${pattern.name})`,
            );
        }
    }
}

export function escapeValue(value: unknown): string {
    if (typeof value === 'string') {
        return value.replace(/'/g, "''");
    }
    return String(value);
}

export function validateAndConvert(key: string, value: unknown): string {
    if (value === null || value === undefined) {
        throw new Error(`Validation failed for '${key}': value cannot be null or undefined`);
    }

    switch (typeof value) {
        case 'number':
            if (Number.isNaN(value) || !Number.isFinite(value)) {
                throw new Error(`Validation failed for '${key}': expected a finite number`);
            }
            return String(value);

        case 'boolean':
            return String(value);

        case 'string':
            detectSqlInjection(key, value);
            return escapeValue(value);

        default:
            throw new Error(
                `Validation failed for '${key}': unsupported type '${typeof value}'`,
            );
    }
}
