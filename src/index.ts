import { loadTemplate } from './loader';
import { validateAndConvert } from './validator';
import { render } from './renderer';
import type { QueryOptions, QueryResult, QueryFn } from './types';

export { SQL_INJECTION_PATTERNS } from './validator';
export type { QueryOptions, QueryResult, QueryFn } from './types';

export function defineQuery<T extends Record<string, string | number | boolean>>(
    filePath: string,
): QueryFn<T> {
    const { template, tokens } = loadTemplate(filePath);

    return (params: T, options?: QueryOptions<T>): QueryResult => {
        const paramKeys = Object.keys(params);

        const missing = tokens.filter((t) => !paramKeys.includes(t));
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
            const customValidator = options?.validators?.[key as keyof T] as
                | ((val: unknown) => boolean)
                | undefined;

            values[key] = validateAndConvert(key, value, customValidator);
        }

        return { sql: render(template, values) };
    };
}
