import path from 'node:path';
import { describe, it, expect } from 'vitest';
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
