import { loadTemplate } from './loader';
import { validateAndConvert } from './validator';
import { render } from './renderer';
import type { SchemaDefinition } from './schema';
import type {
    QueryOptions, QueryResult, QueryFn, SchemaQueryFn,
} from './types';

export { SQL_INJECTION_PATTERNS } from './validator';
export { schema } from './schema';
export type {
    TypeDescriptor, SchemaDefinition, InferParams,
} from './schema';
export type {
    QueryOptions, QueryResult, QueryFn, SchemaQueryFn,
} from './types';

export function defineQuery<S extends SchemaDefinition>(
    filePath: string,
    schemaDef: S,
): SchemaQueryFn<S>;
export function defineQuery<T extends Record<string, string | number | boolean>>(
    filePath: string,
): QueryFn<T>;
export function defineQuery(
    filePath: string,
    schemaDef?: SchemaDefinition,
): (
    params: Record<string, unknown>,
    options?: QueryOptions<Record<string, unknown>>,
) => QueryResult {
    const { template, tokens } = loadTemplate(filePath);

    return (params, options?) => {
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
                const desc = schemaDef[key];
                if (!desc.validate(value)) {
                    throw new Error(`Schema validation failed for '${key}'`);
                }
                values[key] = validateAndConvert(key, value, () => true);
            } else {
                const customValidator = options?.validators?.[key] as
                    | ((val: unknown) => boolean)
                    | undefined;
                values[key] = validateAndConvert(key, value, customValidator);
            }
        }

        return { sql: render(template, values) };
    };
}
