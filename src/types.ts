import type { SchemaDefinition, InferParams } from './schema';

export interface QueryOptions<T> {
    validators?: Partial<Record<keyof T, (val: unknown) => boolean>>;
}

export interface QueryResult {
    sql: string;
}

export type QueryFn<T> = (params: T, options?: QueryOptions<T>) => QueryResult;

export type SchemaQueryFn<S extends SchemaDefinition> = (params: InferParams<S>) => QueryResult;
