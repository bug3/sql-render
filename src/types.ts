import type { SchemaDefinition, InferParams } from './schema';

export interface QueryResult {
    sql: string;
}

export type GenericQueryFn<T> = (params: T) => QueryResult;

export type SchemaQueryFn<S extends SchemaDefinition> = (params: InferParams<S>) => QueryResult;
