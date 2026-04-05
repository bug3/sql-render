import { describe, it, expect } from 'vitest';
import { schema } from '../src/schema';

describe('schema.string', () => {
    it('accepts strings', () => {
        expect(schema.string.validate('hello')).toBe(true);
        expect(schema.string.validate('')).toBe(true);
    });

    it('rejects non-strings', () => {
        expect(schema.string.validate(123)).toBe(false);
        expect(schema.string.validate(null)).toBe(false);
    });
});

describe('schema.number', () => {
    it('accepts finite numbers', () => {
        expect(schema.number.validate(42)).toBe(true);
        expect(schema.number.validate(0)).toBe(true);
        expect(schema.number.validate(-3.14)).toBe(true);
    });

    it('rejects non-finite values', () => {
        expect(schema.number.validate(NaN)).toBe(false);
        expect(schema.number.validate(Infinity)).toBe(false);
        expect(schema.number.validate('42')).toBe(false);
    });
});

describe('schema.boolean', () => {
    it('accepts booleans', () => {
        expect(schema.boolean.validate(true)).toBe(true);
        expect(schema.boolean.validate(false)).toBe(true);
    });

    it('rejects non-booleans', () => {
        expect(schema.boolean.validate(1)).toBe(false);
        expect(schema.boolean.validate('true')).toBe(false);
    });
});

describe('schema.isoDate', () => {
    it('accepts valid dates', () => {
        expect(schema.isoDate.validate('2026-04-01')).toBe(true);
        expect(schema.isoDate.validate('2000-01-31')).toBe(true);
    });

    it('rejects invalid formats', () => {
        expect(schema.isoDate.validate('04-01-2026')).toBe(false);
        expect(schema.isoDate.validate('2026/04/01')).toBe(false);
        expect(schema.isoDate.validate('2026-4-1')).toBe(false);
        expect(schema.isoDate.validate('2026-04-01T00:00:00Z')).toBe(false);
        expect(schema.isoDate.validate('')).toBe(false);
        expect(schema.isoDate.validate(123)).toBe(false);
    });
});

describe('schema.isoTimestamp', () => {
    it('accepts valid timestamps', () => {
        expect(schema.isoTimestamp.validate('2026-04-01T13:57:34Z')).toBe(true);
        expect(schema.isoTimestamp.validate('2026-04-01T13:57:34.000Z')).toBe(true);
        expect(schema.isoTimestamp.validate('2026-04-01T13:57:34.123456Z')).toBe(true);
        expect(schema.isoTimestamp.validate('2026-04-01T13:57:34+03:00')).toBe(true);
        expect(schema.isoTimestamp.validate('2026-04-01T13:57:34-05:00')).toBe(true);
    });

    it('rejects invalid formats', () => {
        expect(schema.isoTimestamp.validate('2026-04-01')).toBe(false);
        expect(schema.isoTimestamp.validate('2026-04-01 13:57:34')).toBe(false);
        expect(schema.isoTimestamp.validate('2026-04-01T13:57:34')).toBe(false);
        expect(schema.isoTimestamp.validate('not-a-timestamp')).toBe(false);
        expect(schema.isoTimestamp.validate(123)).toBe(false);
    });
});

describe('schema.identifier', () => {
    it('accepts valid identifiers', () => {
        expect(schema.identifier.validate('users')).toBe(true);
        expect(schema.identifier.validate('_temp')).toBe(true);
        expect(schema.identifier.validate('event_id')).toBe(true);
        expect(schema.identifier.validate('public.users')).toBe(true);
        expect(schema.identifier.validate('db.schema.table')).toBe(true);
    });

    it('rejects invalid identifiers', () => {
        expect(schema.identifier.validate('123abc')).toBe(false);
        expect(schema.identifier.validate('user-name')).toBe(false);
        expect(schema.identifier.validate('DROP TABLE')).toBe(false);
        expect(schema.identifier.validate('a.b.c.d')).toBe(false);
        expect(schema.identifier.validate('.table')).toBe(false);
        expect(schema.identifier.validate('')).toBe(false);
        expect(schema.identifier.validate(42)).toBe(false);
    });
});

describe('schema.uuid', () => {
    it('accepts valid UUIDs', () => {
        expect(schema.uuid.validate('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
        expect(schema.uuid.validate('00000000-0000-0000-0000-000000000000')).toBe(true);
        expect(schema.uuid.validate('A550E840-E29B-41D4-A716-446655440000')).toBe(true);
    });

    it('rejects invalid UUIDs', () => {
        expect(schema.uuid.validate('550e8400e29b41d4a716446655440000')).toBe(false);
        expect(schema.uuid.validate('not-a-uuid')).toBe(false);
        expect(schema.uuid.validate('550e8400-e29b-41d4-a716')).toBe(false);
        expect(schema.uuid.validate('')).toBe(false);
        expect(schema.uuid.validate(123)).toBe(false);
    });
});

describe('schema.positiveInt', () => {
    it('accepts positive integers', () => {
        expect(schema.positiveInt.validate(1)).toBe(true);
        expect(schema.positiveInt.validate(100)).toBe(true);
        expect(schema.positiveInt.validate(999999)).toBe(true);
    });

    it('rejects non-positive or non-integer values', () => {
        expect(schema.positiveInt.validate(0)).toBe(false);
        expect(schema.positiveInt.validate(-1)).toBe(false);
        expect(schema.positiveInt.validate(3.14)).toBe(false);
        expect(schema.positiveInt.validate(NaN)).toBe(false);
        expect(schema.positiveInt.validate(Infinity)).toBe(false);
        expect(schema.positiveInt.validate('1')).toBe(false);
    });
});

describe('schema.enum', () => {
    const check = schema.enum('active', 'pending', 'done');

    it('accepts allowed values', () => {
        expect(check.validate('active')).toBe(true);
        expect(check.validate('pending')).toBe(true);
        expect(check.validate('done')).toBe(true);
    });

    it('rejects disallowed values', () => {
        expect(check.validate('deleted')).toBe(false);
        expect(check.validate('ACTIVE')).toBe(false);
        expect(check.validate('')).toBe(false);
        expect(check.validate(123)).toBe(false);
    });
});

describe('schema.s3Path', () => {
    it('accepts valid S3 paths', () => {
        expect(schema.s3Path.validate('s3://my-bucket/data/')).toBe(true);
        expect(schema.s3Path.validate('s3://my-bucket/path/to/file.parquet')).toBe(true);
        expect(schema.s3Path.validate('s3://bucket123/year=2024/month=01/')).toBe(true);
        expect(schema.s3Path.validate('s3://my-bucket')).toBe(true);
    });

    it('rejects invalid S3 paths', () => {
        expect(schema.s3Path.validate('gs://bucket/path')).toBe(false);
        expect(schema.s3Path.validate('s3:/bucket/path')).toBe(false);
        expect(schema.s3Path.validate('/local/path')).toBe(false);
        expect(schema.s3Path.validate('')).toBe(false);
        expect(schema.s3Path.validate(123)).toBe(false);
    });
});
