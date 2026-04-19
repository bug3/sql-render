import type { SchemaDefinition, InferParams } from './schema';

export interface QueryResult {
    sql: string;
}

export interface QueryOptions {
    exportTo?: string;
}

export type GenericQueryFn<T> = (params: T, options?: QueryOptions) => QueryResult;

export type SchemaQueryFn<S extends SchemaDefinition> = (
    params: InferParams<S>,
    options?: QueryOptions,
) => QueryResult;
