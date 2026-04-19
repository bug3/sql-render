import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { defineQuery, schema } from '../src/index';

const fixture = (name: string) => path.join(__dirname, 'fixtures', name);

describe('defineQuery — generic mode', () => {
    it('renders a query with basic types', () => {
        const query = defineQuery<{ table: string; id: number }>(fixture('simple.sql'));
        const { sql } = query({ table: 'users', id: 33 });
        expect(sql).toContain('users');
        expect(sql).toContain('id = 33');
    });

    it('validates number type', () => {
        const query = defineQuery<{ table: string; id: number }>(fixture('simple.sql'));
        expect(() => query({ table: 'users', id: NaN })).toThrow('expected a finite number');
    });

    it('detects SQL injection in strings', () => {
        const query = defineQuery<{ table: string; id: number }>(fixture('simple.sql'));
        expect(() => query({ table: 'users; DROP TABLE x', id: 1 })).toThrow(
            'SQL injection pattern detected',
        );
    });

    it('rejects null values', () => {
        const query = defineQuery<{ table: string; id: number }>(fixture('simple.sql'));
        const params = { table: 'users', id: null } as unknown as { table: string; id: number };
        expect(() => query(params)).toThrow('cannot be null or undefined');
    });

    it('escapes single quotes', () => {
        const query = defineQuery<{ table: string; name: string }>(fixture('duplicate-vars.sql'));
        const { sql } = query({ table: 'users', name: "O'Brien" });
        expect(sql).toContain("O''Brien");
    });

    it('throws on missing params', () => {
        const query = defineQuery<{ table: string; id: number }>(fixture('simple.sql'));
        expect(() => query({ table: 'users' } as { table: string; id: number })).toThrow(
            'Missing variables in params: [id]',
        );
    });

    it('throws on extra params', () => {
        const query = defineQuery<{ table: string; id: number }>(fixture('simple.sql'));
        const params = { table: 'users', id: 1, foo: 'bar' } as unknown as { table: string; id: number };
        expect(() => query(params)).toThrow('Extra variables not in template: [foo]');
    });
});

describe('defineQuery — schema mode', () => {
    it('renders a full query with all parameters', () => {
        const getEvents = defineQuery(fixture('getEvents.sql'), {
            tableName: schema.identifier,
            status: schema.string,
            startDate: schema.isoDate,
            orderBy: schema.identifier,
            limit: schema.positiveInt,
        });

        const { sql } = getEvents({
            tableName: 'prod_events',
            status: 'active',
            startDate: '2022-02-22',
            orderBy: 'created_at',
            limit: 99,
        });

        expect(sql).toContain('prod_events');
        expect(sql).toContain("status = 'active'");
        expect(sql).toContain("created_at >= '2022-02-22'");
        expect(sql).toContain('created_at');
        expect(sql).toContain('99');
    });

    it('renders a simple query', () => {
        const query = defineQuery(fixture('simple.sql'), {
            table: schema.identifier,
            id: schema.number,
        });
        const { sql } = query({ table: 'users', id: 33 });
        expect(sql).toContain('users');
        expect(sql).toContain('id = 33');
    });

    it('handles a query with no variables', () => {
        const query = defineQuery(fixture('no-vars.sql'), {});
        const { sql } = query({});
        expect(sql).toContain('SELECT');
        expect(sql).toContain('1');
    });

    it('handles duplicate tokens', () => {
        const query = defineQuery(fixture('duplicate-vars.sql'), {
            table: schema.identifier,
            name: schema.string,
        });
        const { sql } = query({ table: 'users', name: 'john' });
        expect(sql).toContain('users');
        expect(sql).toContain("name = 'john'");
        expect(sql).toContain("alias = 'john'");
    });

    it('escapes single quotes in string values', () => {
        const query = defineQuery(fixture('duplicate-vars.sql'), {
            table: schema.identifier,
            name: schema.string,
        });
        const { sql } = query({ table: 'users', name: "O'Brien" });
        expect(sql).toContain("O''Brien");
    });

    describe('schema validation at define time', () => {
        it('throws when schema is missing a template variable', () => {
            expect(() => defineQuery(fixture('simple.sql'), {
                table: schema.identifier,
            })).toThrow('Schema missing definitions for template variables: [id]');
        });

        it('throws when schema has extra variables', () => {
            expect(() => defineQuery(fixture('simple.sql'), {
                table: schema.identifier,
                id: schema.number,
                foo: schema.string,
            })).toThrow('Schema defines variables not in template: [foo]');
        });
    });

    describe('runtime validation', () => {
        it('throws on missing params', () => {
            const query = defineQuery(fixture('simple.sql'), {
                table: schema.identifier,
                id: schema.number,
            });
            expect(() => query({ table: 'users' } as { table: string; id: number })).toThrow(
                'Missing variables in params: [id]',
            );
        });

        it('throws on extra params', () => {
            const query = defineQuery(fixture('simple.sql'), {
                table: schema.identifier,
                id: schema.number,
            });
            const params = { table: 'users', id: 1, foo: 'bar' } as unknown as { table: string; id: number };
            expect(() => query(params)).toThrow('Extra variables not in template: [foo]');
        });

        it('throws on null value', () => {
            const query = defineQuery(fixture('simple.sql'), {
                table: schema.identifier,
                id: schema.number,
            });
            const params = { table: 'users', id: null } as unknown as { table: string; id: number };
            expect(() => query(params)).toThrow('cannot be null or undefined');
        });

        it('throws on SQL injection in schema.string', () => {
            const query = defineQuery(fixture('simple.sql'), {
                table: schema.string,
                id: schema.number,
            });
            expect(() => query({ table: 'users; DROP TABLE users', id: 1 })).toThrow(
                'Schema validation failed',
            );
        });

        it('throws on invalid identifier', () => {
            const query = defineQuery(fixture('simple.sql'), {
                table: schema.identifier,
                id: schema.number,
            });
            expect(() => query({ table: 'DROP TABLE users', id: 1 })).toThrow(
                'Schema validation failed',
            );
        });

        it('throws on invalid date', () => {
            const query = defineQuery(fixture('getEvents.sql'), {
                tableName: schema.identifier,
                status: schema.string,
                startDate: schema.isoDate,
                orderBy: schema.identifier,
                limit: schema.positiveInt,
            });
            expect(() => query({
                tableName: 'events',
                status: 'active',
                startDate: 'not-a-date',
                orderBy: 'created_at',
                limit: 99,
            })).toThrow('Schema validation failed');
        });

        it('throws on non-positive integer for positiveInt', () => {
            const query = defineQuery(fixture('simple.sql'), {
                table: schema.identifier,
                id: schema.positiveInt,
            });
            expect(() => query({ table: 'users', id: -1 })).toThrow('Schema validation failed');
        });
    });

    describe('schema.enum', () => {
        it('accepts allowed values', () => {
            const query = defineQuery(fixture('simple.sql'), {
                table: schema.enum('users', 'events', 'logs'),
                id: schema.positiveInt,
            });
            const { sql } = query({ table: 'users', id: 1 });
            expect(sql).toContain('users');
        });

        it('rejects disallowed values', () => {
            const query = defineQuery(fixture('simple.sql'), {
                table: schema.enum('users', 'events', 'logs'),
                id: schema.positiveInt,
            });
            expect(() => query({ table: 'secrets', id: 1 })).toThrow('Schema validation failed');
        });
    });

    describe('invalid schema descriptors', () => {
        it('throws on null descriptor', () => {
            expect(() => defineQuery(fixture('simple.sql'), {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                table: null as any,
                id: schema.number,
            })).toThrow('Invalid schema descriptor');
        });

        it('throws on descriptor without validate method', () => {
            expect(() => defineQuery(fixture('simple.sql'), {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                table: { foo: 'bar' } as any,
                id: schema.number,
            })).toThrow('must have a validate(val) method');
        });
    });

    describe('exportTo option', () => {
        let tmpDir: string;

        beforeEach(() => {
            tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sql-render-'));
        });

        afterEach(() => {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        });

        it('writes rendered sql to the given file', () => {
            const query = defineQuery(fixture('simple.sql'), {
                table: schema.identifier,
                id: schema.number,
            });
            const outPath = path.join(tmpDir, 'rendered.sql');
            const { sql } = query({ table: 'users', id: 33 }, { exportTo: outPath });
            expect(fs.readFileSync(outPath, 'utf-8')).toBe(sql);
        });

        it('creates parent directories recursively', () => {
            const query = defineQuery(fixture('simple.sql'), {
                table: schema.identifier,
                id: schema.number,
            });
            const outPath = path.join(tmpDir, 'nested', 'deep', 'out.sql');
            query({ table: 'users', id: 1 }, { exportTo: outPath });
            expect(fs.existsSync(outPath)).toBe(true);
        });

        it('does not write a file when exportTo is omitted', () => {
            const query = defineQuery(fixture('simple.sql'), {
                table: schema.identifier,
                id: schema.number,
            });
            query({ table: 'users', id: 1 });
            expect(fs.readdirSync(tmpDir)).toHaveLength(0);
        });

        it('works in generic mode', () => {
            const query = defineQuery<{ table: string; id: number }>(fixture('simple.sql'));
            const outPath = path.join(tmpDir, 'generic.sql');
            const { sql } = query({ table: 'users', id: 7 }, { exportTo: outPath });
            expect(fs.readFileSync(outPath, 'utf-8')).toBe(sql);
        });
    });

    describe('schema.array', () => {
        it('renders a list of numbers without quotes', () => {
            const query = defineQuery(fixture('in-clause.sql'), {
                table: schema.identifier,
                ids: schema.array(schema.positiveInt),
            });
            const { sql } = query({ table: 'users', ids: [1, 2, 3] });
            expect(sql).toContain('IN (1, 2, 3)');
        });

        it('renders a list of strings with quotes and escapes single quotes', () => {
            const query = defineQuery(fixture('in-clause.sql'), {
                table: schema.identifier,
                ids: schema.array(schema.string),
            });
            const { sql } = query({ table: 'users', ids: ['a', "O'Brien"] });
            expect(sql).toContain("IN ('a', 'O''Brien')");
        });

        it('rejects an empty array', () => {
            const query = defineQuery(fixture('in-clause.sql'), {
                table: schema.identifier,
                ids: schema.array(schema.positiveInt),
            });
            expect(() => query({ table: 'users', ids: [] })).toThrow('Schema validation failed');
        });

        it('rejects a mixed-type array when inner is strict', () => {
            const query = defineQuery(fixture('in-clause.sql'), {
                table: schema.identifier,
                ids: schema.array(schema.positiveInt),
            });
            expect(() => query({
                table: 'users',
                ids: [1, -1, 2] as unknown as number[],
            })).toThrow('Schema validation failed');
        });
    });

    describe('schema.nullable', () => {
        it('renders null as the SQL NULL literal', () => {
            const query = defineQuery(fixture('nullable.sql'), {
                table: schema.identifier,
                lastLogin: schema.nullable(schema.isoTimestamp),
                id: schema.positiveInt,
            });
            const { sql } = query({ table: 'users', lastLogin: null, id: 1 });
            expect(sql).toContain('last_login = NULL');
        });

        it('renders undefined as the SQL NULL literal', () => {
            const query = defineQuery(fixture('nullable.sql'), {
                table: schema.identifier,
                lastLogin: schema.nullable(schema.isoTimestamp),
                id: schema.positiveInt,
            });
            const { sql } = query({
                table: 'users',
                lastLogin: undefined as unknown as string,
                id: 1,
            });
            expect(sql).toContain('last_login = NULL');
        });

        it('delegates to the inner escape for non-null values', () => {
            const query = defineQuery(fixture('nullable.sql'), {
                table: schema.identifier,
                lastLogin: schema.nullable(schema.isoTimestamp),
                id: schema.positiveInt,
            });
            const { sql } = query({
                table: 'users',
                lastLogin: '2022-02-22T22:02:22Z',
                id: 1,
            });
            expect(sql).toContain('last_login = 2022-02-22T22:02:22Z');
        });

        it('still rejects invalid non-null values', () => {
            const query = defineQuery(fixture('nullable.sql'), {
                table: schema.identifier,
                lastLogin: schema.nullable(schema.isoTimestamp),
                id: schema.positiveInt,
            });
            expect(() => query({ table: 'users', lastLogin: 'nope', id: 1 }))
                .toThrow('Schema validation failed');
        });

        it('non-nullable descriptors still reject null with the dedicated message', () => {
            const query = defineQuery(fixture('simple.sql'), {
                table: schema.identifier,
                id: schema.positiveInt,
            });
            const params = { table: 'users', id: null } as unknown as { table: string; id: number };
            expect(() => query(params)).toThrow('cannot be null or undefined');
        });
    });

    describe('custom schema types', () => {
        it('accepts a custom type descriptor', () => {
            const prodTable = {
                validate: (val: unknown) => typeof val === 'string' && val.startsWith('prod_'),
            };
            const query = defineQuery(fixture('simple.sql'), {
                table: prodTable,
                id: schema.number,
            });
            const { sql } = query({ table: 'prod_users', id: 1 });
            expect(sql).toContain('prod_users');
        });

        it('throws when custom type validation fails', () => {
            const prodTable = {
                validate: (val: unknown) => typeof val === 'string' && val.startsWith('prod_'),
            };
            const query = defineQuery(fixture('simple.sql'), {
                table: prodTable,
                id: schema.number,
            });
            expect(() => query({ table: 'staging_users', id: 1 })).toThrow('Schema validation failed');
        });
    });
});
