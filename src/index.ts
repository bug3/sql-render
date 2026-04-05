import { loadTemplate } from './loader';
import { escapeValue } from './validator';
import { render } from './renderer';
import type { SchemaDefinition, InferParams } from './schema';
import type { QueryResult } from './types';

export { SQL_INJECTION_PATTERNS } from './validator';
export { schema } from './schema';
export type { TypeDescriptor, SchemaDefinition, InferParams } from './schema';
export type { QueryResult, QueryFn } from './types';

export function defineQuery<S extends SchemaDefinition>(
    filePath: string,
    schemaDef: S,
): (params: InferParams<S>) => QueryResult {
    const { template, tokens } = loadTemplate(filePath);

    const schemaKeys = Object.keys(schemaDef);
    const missingInSchema = tokens.filter((tok) => !schemaKeys.includes(tok));
    if (missingInSchema.length > 0) {
        throw new Error(`Schema missing definitions for template variables: [${missingInSchema.join(', ')}]`);
    }

    const extraInSchema = schemaKeys.filter((k) => !tokens.includes(k));
    if (extraInSchema.length > 0) {
        throw new Error(`Schema defines variables not in template: [${extraInSchema.join(', ')}]`);
    }

    return (params: InferParams<S>): QueryResult => {
        const paramKeys = Object.keys(params as Record<string, unknown>);

        const missing = tokens.filter((tok) => !paramKeys.includes(tok));
        if (missing.length > 0) {
            throw new Error(`Missing variables in params: [${missing.join(', ')}]`);
        }

        const extra = paramKeys.filter((k) => !tokens.includes(k));
        if (extra.length > 0) {
            throw new Error(`Extra variables not in template: [${extra.join(', ')}]`);
        }

        const values: Record<string, string> = {};

        for (const key of tokens) {
            const value = (params as Record<string, unknown>)[key];

            if (value === null || value === undefined) {
                throw new Error(`Validation failed for '${key}': value cannot be null or undefined`);
            }

            const desc = schemaDef[key];
            if (!desc.validate(value)) {
                throw new Error(`Schema validation failed for '${key}'`);
            }

            values[key] = escapeValue(value);
        }

        return { sql: render(template, values) };
    };
}
