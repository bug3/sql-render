import { describe, it, expect } from 'vitest';
import { v } from '../src/validators';

describe('v.isoDate', () => {
    const check = v.isoDate();

    it('accepts valid dates', () => {
        expect(check('2026-04-01')).toBe(true);
        expect(check('2000-01-31')).toBe(true);
    });

    it('rejects invalid formats', () => {
        expect(check('04-01-2026')).toBe(false);
        expect(check('2026/04/01')).toBe(false);
        expect(check('2026-4-1')).toBe(false);
        expect(check('2026-04-01T00:00:00Z')).toBe(false);
        expect(check('')).toBe(false);
        expect(check(123)).toBe(false);
    });
});

describe('v.isoTimestamp', () => {
    const check = v.isoTimestamp();

    it('accepts valid timestamps', () => {
        expect(check('2026-04-01T13:57:34Z')).toBe(true);
        expect(check('2026-04-01T13:57:34.000Z')).toBe(true);
        expect(check('2026-04-01T13:57:34.123456Z')).toBe(true);
        expect(check('2026-04-01T13:57:34+03:00')).toBe(true);
        expect(check('2026-04-01T13:57:34-05:00')).toBe(true);
    });

    it('rejects invalid formats', () => {
        expect(check('2026-04-01')).toBe(false);
        expect(check('2026-04-01 13:57:34')).toBe(false);
        expect(check('2026-04-01T13:57:34')).toBe(false);
        expect(check('not-a-timestamp')).toBe(false);
        expect(check(123)).toBe(false);
    });
});

describe('v.identifier', () => {
    const check = v.identifier();

    it('accepts valid identifiers', () => {
        expect(check('users')).toBe(true);
        expect(check('_temp')).toBe(true);
        expect(check('event_id')).toBe(true);
        expect(check('public.users')).toBe(true);
        expect(check('db.schema.table')).toBe(true);
    });

    it('rejects invalid identifiers', () => {
        expect(check('123abc')).toBe(false);
        expect(check('user-name')).toBe(false);
        expect(check('DROP TABLE')).toBe(false);
        expect(check('a.b.c.d')).toBe(false);
        expect(check('.table')).toBe(false);
        expect(check('')).toBe(false);
        expect(check(42)).toBe(false);
    });
});

describe('v.uuid', () => {
    const check = v.uuid();

    it('accepts valid UUIDs', () => {
        expect(check('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
        expect(check('00000000-0000-0000-0000-000000000000')).toBe(true);
        expect(check('A550E840-E29B-41D4-A716-446655440000')).toBe(true);
    });

    it('rejects invalid UUIDs', () => {
        expect(check('550e8400e29b41d4a716446655440000')).toBe(false);
        expect(check('not-a-uuid')).toBe(false);
        expect(check('550e8400-e29b-41d4-a716')).toBe(false);
        expect(check('')).toBe(false);
        expect(check(123)).toBe(false);
    });
});

describe('v.positiveInt', () => {
    const check = v.positiveInt();

    it('accepts positive integers', () => {
        expect(check(1)).toBe(true);
        expect(check(100)).toBe(true);
        expect(check(999999)).toBe(true);
    });

    it('rejects non-positive or non-integer values', () => {
        expect(check(0)).toBe(false);
        expect(check(-1)).toBe(false);
        expect(check(3.14)).toBe(false);
        expect(check(NaN)).toBe(false);
        expect(check(Infinity)).toBe(false);
        expect(check('1')).toBe(false);
    });
});

describe('v.enum', () => {
    const check = v.enum(['active', 'pending', 'done']);

    it('accepts allowed values', () => {
        expect(check('active')).toBe(true);
        expect(check('pending')).toBe(true);
        expect(check('done')).toBe(true);
    });

    it('rejects disallowed values', () => {
        expect(check('deleted')).toBe(false);
        expect(check('ACTIVE')).toBe(false);
        expect(check('')).toBe(false);
        expect(check(123)).toBe(false);
    });
});

describe('v.s3Path', () => {
    const check = v.s3Path();

    it('accepts valid S3 paths', () => {
        expect(check('s3://my-bucket/data/')).toBe(true);
        expect(check('s3://my-bucket/path/to/file.parquet')).toBe(true);
        expect(check('s3://bucket123/year=2024/month=01/')).toBe(true);
        expect(check('s3://my-bucket')).toBe(true);
    });

    it('rejects invalid S3 paths', () => {
        expect(check('gs://bucket/path')).toBe(false);
        expect(check('s3:/bucket/path')).toBe(false);
        expect(check('/local/path')).toBe(false);
        expect(check('')).toBe(false);
        expect(check(123)).toBe(false);
    });
});
