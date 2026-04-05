import type { SchemaDefinition, InferParams } from './schema';

export interface QueryResult {
    sql: string;
}

export type QueryFn<S extends SchemaDefinition> = (params: InferParams<S>) => QueryResult;
