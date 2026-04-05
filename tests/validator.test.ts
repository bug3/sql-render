import { describe, it, expect } from 'vitest';
import { escapeValue, SQL_INJECTION_PATTERNS } from '../src/validator';

describe('escapeValue', () => {
    it('escapes single quotes in strings', () => {
        expect(escapeValue("O'Brien")).toBe("O''Brien");
    });

    it('escapes multiple single quotes', () => {
        expect(escapeValue("it's a 'test'")).toBe("it''s a ''test''");
    });

    it('returns string unchanged if no quotes', () => {
        expect(escapeValue('hello')).toBe('hello');
    });

    it('converts numbers to string', () => {
        expect(escapeValue(100)).toBe('100');
        expect(escapeValue(3.14)).toBe('3.14');
    });

    it('converts booleans to string', () => {
        expect(escapeValue(true)).toBe('true');
        expect(escapeValue(false)).toBe('false');
    });
});

describe('SQL_INJECTION_PATTERNS', () => {
    it('is exported as an array', () => {
        expect(SQL_INJECTION_PATTERNS).toBeInstanceOf(Array);
        expect(SQL_INJECTION_PATTERNS.length).toBeGreaterThan(0);
        expect(SQL_INJECTION_PATTERNS[0]).toHaveProperty('name');
        expect(SQL_INJECTION_PATTERNS[0]).toHaveProperty('regex');
    });
});
