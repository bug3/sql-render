import { SQL_INJECTION_PATTERNS } from './validator';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/;
const IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*){0,2}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const S3_PATH_REGEX = /^s3:\/\/(?![^/]*\.\.)[a-z0-9][a-z0-9.-]{1,61}[a-z0-9](\/[a-zA-Z0-9._\-/=]*)?$/;

export interface TypeDescriptor<T = unknown> {
    readonly __phantom?: T;
    validate(val: unknown): boolean;
    escape?(val: unknown): string;
}

function descriptor<T>(validate: (val: unknown) => boolean): TypeDescriptor<T> {
    return { validate };
}

function formatArrayElement(val: unknown): string {
    if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
    return String(val);
}

function isString(val: unknown): val is string {
    return typeof val === 'string';
}

function isValidDate(year: number, month: number, day: number): boolean {
    const d = new Date(year, month - 1, day);
    return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

function isValidTime(hours: number, minutes: number, seconds: number): boolean {
    return hours >= 0 && hours <= 23
        && minutes >= 0 && minutes <= 59
        && seconds >= 0 && seconds <= 60;
}

export const schema = {
    string: descriptor<string>((val) => {
        if (!isString(val)) return false;
        return !SQL_INJECTION_PATTERNS.some((p) => p.regex.test(val));
    }),
    number: descriptor<number>((val) => typeof val === 'number' && Number.isFinite(val)),
    boolean: descriptor<boolean>((val) => typeof val === 'boolean'),

    isoDate: descriptor<string>((val) => {
        if (!isString(val) || !ISO_DATE_REGEX.test(val)) return false;
        const [y, m, d] = val.split('-').map(Number);
        return isValidDate(y, m, d);
    }),
    isoTimestamp: descriptor<string>((val) => {
        if (!isString(val) || !ISO_TIMESTAMP_REGEX.test(val)) return false;
        const [datePart, rest] = val.split('T');
        const [y, m, d] = datePart.split('-').map(Number);
        if (!isValidDate(y, m, d)) return false;
        const timePart = rest.replace(/[Z+-].*$/, '');
        const [hh, mm, ssRaw] = timePart.split(':');
        const ss = parseFloat(ssRaw);
        return isValidTime(Number(hh), Number(mm), Math.floor(ss));
    }),
    identifier: descriptor<string>((val) => isString(val) && IDENTIFIER_REGEX.test(val)),
    uuid: descriptor<string>((val) => isString(val) && UUID_REGEX.test(val)),
    positiveInt: descriptor<number>((val) => typeof val === 'number' && Number.isInteger(val) && val > 0),
    s3Path: descriptor<string>((val) => isString(val) && S3_PATH_REGEX.test(val)),

    enum: <T extends string>(...values: T[]): TypeDescriptor<T> => descriptor<T>(
        (val) => isString(val) && (values as string[]).includes(val),
    ),

    array: <T>(inner: TypeDescriptor<T>): TypeDescriptor<T[]> => ({
        validate: (val) => Array.isArray(val)
            && val.length > 0
            && val.every((v) => inner.validate(v)),
        escape: (val) => (val as unknown[])
            .map((v) => (inner.escape ? inner.escape(v) : formatArrayElement(v)))
            .join(', '),
    }),
};

export type SchemaDefinition = Record<string, TypeDescriptor>;

export type InferParams<S extends SchemaDefinition> = {
    [K in keyof S]: S[K] extends TypeDescriptor<infer T> ? T : never;
};
