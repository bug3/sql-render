const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/;
const IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*){0,2}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const S3_PATH_REGEX = /^s3:\/\/[a-z0-9][a-z0-9.-]{1,61}[a-z0-9](\/[a-zA-Z0-9._\-/=]*)?$/;

export interface TypeDescriptor<T = unknown> {
    readonly __phantom?: T;
    validate(val: unknown): boolean;
}

function descriptor<T>(validate: (val: unknown) => boolean): TypeDescriptor<T> {
    return { validate };
}

function isString(val: unknown): val is string {
    return typeof val === 'string';
}

export const schema = {
    string: descriptor<string>((val) => isString(val)),
    number: descriptor<number>((val) => typeof val === 'number' && Number.isFinite(val)),
    boolean: descriptor<boolean>((val) => typeof val === 'boolean'),

    isoDate: descriptor<string>((val) => isString(val) && ISO_DATE_REGEX.test(val)),
    isoTimestamp: descriptor<string>((val) => isString(val) && ISO_TIMESTAMP_REGEX.test(val)),
    identifier: descriptor<string>((val) => isString(val) && IDENTIFIER_REGEX.test(val)),
    uuid: descriptor<string>((val) => isString(val) && UUID_REGEX.test(val)),
    positiveInt: descriptor<number>((val) => typeof val === 'number' && Number.isInteger(val) && val > 0),
    s3Path: descriptor<string>((val) => isString(val) && S3_PATH_REGEX.test(val)),

    enum: <T extends string>(...values: T[]): TypeDescriptor<T> => descriptor<T>(
        (val) => isString(val) && (values as string[]).includes(val),
    ),
};

export type SchemaDefinition = Record<string, TypeDescriptor>;

export type InferParams<S extends SchemaDefinition> = {
    [K in keyof S]: S[K] extends TypeDescriptor<infer T> ? T : never;
};
