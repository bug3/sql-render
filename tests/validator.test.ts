import { describe, it, expect } from 'vitest';
import { validateAndConvert, escapeValue, SQL_INJECTION_PATTERNS } from '../src/validator';

describe('escapeValue', () => {
    it('escapes single quotes in strings', () => {
        expect(escapeValue("O'Brien")).toBe("O''Brien");
    });

    it('converts numbers to string', () => {
        expect(escapeValue(100)).toBe('100');
    });

    it('converts booleans to string', () => {
        expect(escapeValue(true)).toBe('true');
    });
});

describe('validateAndConvert', () => {
    it('rejects null', () => {
        expect(() => validateAndConvert('key', null)).toThrow('cannot be null or undefined');
    });

    it('rejects undefined', () => {
        expect(() => validateAndConvert('key', undefined)).toThrow('cannot be null or undefined');
    });

    it('accepts valid numbers', () => {
        expect(validateAndConvert('limit', 100)).toBe('100');
    });

    it('rejects NaN', () => {
        expect(() => validateAndConvert('limit', NaN)).toThrow('expected a finite number');
    });

    it('rejects Infinity', () => {
        expect(() => validateAndConvert('limit', Infinity)).toThrow('expected a finite number');
    });

    it('accepts booleans', () => {
        expect(validateAndConvert('active', true)).toBe('true');
        expect(validateAndConvert('active', false)).toBe('false');
    });

    it('accepts clean strings', () => {
        expect(validateAndConvert('name', 'hello')).toBe('hello');
    });

    it('escapes single quotes in strings', () => {
        expect(validateAndConvert('name', "O'Brien")).toBe("O''Brien");
    });

    it('detects SQL injection patterns', () => {
        expect(() => validateAndConvert('f', 'value -- comment')).toThrow('SQL injection pattern detected');
        expect(() => validateAndConvert('f', 'value; DROP')).toThrow('SQL injection pattern detected');
        expect(() => validateAndConvert('f', 'DROP TABLE users')).toThrow('SQL injection pattern detected');
        expect(() => validateAndConvert('f', '1 UNION SELECT *')).toThrow('SQL injection pattern detected');
    });

    it('does not flag partial word matches', () => {
        expect(() => validateAndConvert('f', 'backdrop')).not.toThrow();
        expect(() => validateAndConvert('f', 'executor')).not.toThrow();
        expect(() => validateAndConvert('f', 'creative')).not.toThrow();
    });

    it('rejects unsupported types', () => {
        expect(() => validateAndConvert('key', {} as unknown)).toThrow('unsupported type');
    });
});

describe('SQL_INJECTION_PATTERNS', () => {
    it('is exported as an array', () => {
        expect(SQL_INJECTION_PATTERNS).toBeInstanceOf(Array);
        expect(SQL_INJECTION_PATTERNS.length).toBeGreaterThan(0);
    });
});
