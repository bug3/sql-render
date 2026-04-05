const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/;
const IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*){0,2}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const S3_PATH_REGEX = /^s3:\/\/[a-z0-9][a-z0-9.-]{1,61}[a-z0-9](\/[a-zA-Z0-9._\-/=]*)?$/;

function isString(val: unknown): val is string {
    return typeof val === 'string';
}

export const v = {
    isoDate: () => (val: unknown) => isString(val) && ISO_DATE_REGEX.test(val),

    isoTimestamp: () => (val: unknown) => isString(val) && ISO_TIMESTAMP_REGEX.test(val),

    identifier: () => (val: unknown) => isString(val) && IDENTIFIER_REGEX.test(val),

    uuid: () => (val: unknown) => isString(val) && UUID_REGEX.test(val),

    positiveInt: () => (val: unknown) => typeof val === 'number'
        && Number.isInteger(val)
        && val > 0,

    enum: (allowed: readonly string[]) => (val: unknown) => isString(val)
        && allowed.includes(val),

    s3Path: () => (val: unknown) => isString(val) && S3_PATH_REGEX.test(val),
};
