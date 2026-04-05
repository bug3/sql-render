export interface QueryOptions<T> {
  validators?: Partial<Record<keyof T, (val: unknown) => boolean>>;
}

export interface QueryResult {
  sql: string;
}

export type QueryFn<T> = (params: T, options?: QueryOptions<T>) => QueryResult;
