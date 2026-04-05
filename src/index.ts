import { loadTemplate } from './loader';
import { validateAndConvert, escapeValue } from './validator';
import { render } from './renderer';
import type { SchemaDefinition } from './schema';
import type {
    QueryResult, GenericQueryFn, SchemaQueryFn,
} from './types';

export { SQL_INJECTION_PATTERNS } from './validator';
export { schema } from './schema';
export type { TypeDescriptor, SchemaDefinition, InferParams } from './schema';
export type {
    QueryResult, GenericQueryFn, SchemaQueryFn,
} from './types';

export function defineQuery<S extends SchemaDefinition>(
    filePath: string,
    schemaDef: S,
): SchemaQueryFn<S>;
export function defineQuery<T extends Record<string, string | number | boolean>>(
    filePath: string,
): GenericQueryFn<T>;
export function defineQuery(
    filePath: string,
    schemaDef?: SchemaDefinition,
): (params: Record<string, unknown>) => QueryResult {
    const { template, tokens } = loadTemplate(filePath);

    if (schemaDef) {
        const schemaKeys = Object.keys(schemaDef);

        const missingInSchema = tokens.filter((tok) => !schemaKeys.includes(tok));
        if (missingInSchema.length > 0) {
            throw new Error(
                `Schema missing definitions for template variables: [${missingInSchema.join(', ')}]`,
            );
        }

        const extraInSchema = schemaKeys.filter((k) => !tokens.includes(k));
        if (extraInSchema.length > 0) {
            throw new Error(
                `Schema defines variables not in template: [${extraInSchema.join(', ')}]`,
            );
        }
    }

    return (params) => {
        const paramKeys = Object.keys(params);

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
            const value = params[key];

            if (schemaDef) {
                if (value === null || value === undefined) {
                    throw new Error(`Validation failed for '${key}': value cannot be null or undefined`);
                }
                const desc = schemaDef[key];
                if (!desc.validate(value)) {
                    throw new Error(`Schema validation failed for '${key}'`);
                }
                values[key] = escapeValue(value);
            } else {
                values[key] = validateAndConvert(key, value);
            }
        }

        return { sql: render(template, values) };
    };
}
