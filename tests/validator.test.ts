import { describe, it, expect } from 'vitest';
import { validateAndConvert, SQL_INJECTION_PATTERNS } from '../src/validator';

describe('validateAndConvert', () => {
    describe('null / undefined', () => {
        it('rejects null', () => {
            expect(() => validateAndConvert('key', null)).toThrow('cannot be null or undefined');
        });

        it('rejects undefined', () => {
            expect(() => validateAndConvert('key', undefined)).toThrow('cannot be null or undefined');
        });
    });

    describe('number', () => {
        it('accepts a valid integer', () => {
            expect(validateAndConvert('limit', 100)).toBe('100');
        });

        it('accepts a valid float', () => {
            expect(validateAndConvert('score', 3.14)).toBe('3.14');
        });

        it('accepts zero', () => {
            expect(validateAndConvert('offset', 0)).toBe('0');
        });

        it('accepts negative numbers', () => {
            expect(validateAndConvert('delta', -5)).toBe('-5');
        });

        it('rejects NaN', () => {
            expect(() => validateAndConvert('limit', NaN)).toThrow('expected a finite number');
        });

        it('rejects Infinity', () => {
            expect(() => validateAndConvert('limit', Infinity)).toThrow('expected a finite number');
        });

        it('rejects -Infinity', () => {
            expect(() => validateAndConvert('limit', -Infinity)).toThrow('expected a finite number');
        });
    });

    describe('boolean', () => {
        it('accepts true', () => {
            expect(validateAndConvert('active', true)).toBe('true');
        });

        it('accepts false', () => {
            expect(validateAndConvert('active', false)).toBe('false');
        });
    });

    describe('string', () => {
        it('accepts a clean string', () => {
            expect(validateAndConvert('name', 'hello')).toBe('hello');
        });

        it('escapes single quotes', () => {
            expect(validateAndConvert('name', "O'Brien")).toBe("O''Brien");
        });

        it('escapes multiple single quotes', () => {
            expect(validateAndConvert('val', "it's a 'test'")).toBe("it''s a ''test''");
        });
    });

    describe('SQL injection detection', () => {
        const injectionCases: [string, string][] = [
            ['inline comment', 'value -- comment'],
            ['block comment open', 'value /* comment'],
            ['block comment close', 'value */ end'],
            ['statement separator', 'value; DROP TABLE'],
            ['DDL command', 'DROP TABLE users'],
            ['DDL command', 'alter table users'],
            ['DDL command', 'TRUNCATE users'],
            ['DDL command', 'CREATE TABLE x'],
            ['UNION injection', '1 UNION SELECT * FROM users'],
            ['UNION injection', '1 union all select 1'],
            ['INSERT', 'INSERT INTO users VALUES(1)'],
            ['DELETE', 'DELETE FROM users'],
            ['UPDATE', 'UPDATE users SET name'],
            ['EXEC', 'EXEC sp_help'],
            ['EXEC', 'EXECUTE xp_cmdshell'],
            ['time-based injection', 'SLEEP(5)'],
            ['time-based injection', 'BENCHMARK(1000, SHA1(\'test\'))'],
            ['WAITFOR', 'WAITFOR DELAY \'00:00:05\''],
            ['system procedure', 'xp_cmdshell \'dir\''],
            ['system procedure', 'sp_executesql'],
        ];

        it.each(injectionCases)('detects %s pattern: "%s"', (_name, value) => {
            expect(() => validateAndConvert('field', value)).toThrow('SQL injection pattern detected');
        });

        it('does not flag clean values', () => {
            const safeValues = [
                'hello world',
                'prod_events',
                'created_at',
                '2024-01-01',
                'active',
                'John Doe',
                'some-value-with-dashes',
                'ORDER_CONFIRMED',
                'event_name DESC',
            ];
            safeValues.forEach((val) => {
                expect(() => validateAndConvert('field', val)).not.toThrow();
            });
        });

        it('uses word boundaries — does not flag partial matches', () => {
            expect(() => validateAndConvert('field', 'backdrop')).not.toThrow();
            expect(() => validateAndConvert('field', 'executor')).not.toThrow();
            expect(() => validateAndConvert('field', 'creative')).not.toThrow();
        });
    });

    describe('custom validators', () => {
        it('passes when custom validator returns true', () => {
            const validator = (val: unknown) => typeof val === 'string' && /^[a-z]+$/.test(val);
            expect(validateAndConvert('status', 'active', validator)).toBe('active');
        });

        it('throws when custom validator returns false', () => {
            const validator = (val: unknown) => typeof val === 'string' && /^[a-z]+$/.test(val);
            expect(() => validateAndConvert('status', 'INVALID', validator)).toThrow(
                'Custom validation failed',
            );
        });

        it('bypasses built-in SQL injection checks when custom validator is provided', () => {
            const allowAll = () => true;
            expect(() => validateAndConvert('field', 'DROP TABLE users', allowAll)).not.toThrow();
        });

        it('still escapes single quotes even with custom validator', () => {
            const allowAll = () => true;
            expect(validateAndConvert('name', "O'Brien", allowAll)).toBe("O''Brien");
        });

        it('works with number values', () => {
            const isPositive = (val: unknown) => typeof val === 'number' && val > 0;
            expect(validateAndConvert('limit', 10, isPositive)).toBe('10');
            expect(() => validateAndConvert('limit', -1, isPositive)).toThrow('Custom validation failed');
        });
    });

    describe('unsupported types', () => {
        it('rejects objects', () => {
            expect(() => validateAndConvert('key', {} as unknown)).toThrow('unsupported type');
        });

        it('rejects arrays', () => {
            expect(() => validateAndConvert('key', [] as unknown)).toThrow('unsupported type');
        });
    });

    it('exports SQL_INJECTION_PATTERNS for user reference', () => {
        expect(SQL_INJECTION_PATTERNS).toBeInstanceOf(Array);
        expect(SQL_INJECTION_PATTERNS.length).toBeGreaterThan(0);
        expect(SQL_INJECTION_PATTERNS[0]).toHaveProperty('name');
        expect(SQL_INJECTION_PATTERNS[0]).toHaveProperty('regex');
    });
});
