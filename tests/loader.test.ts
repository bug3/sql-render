import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { loadTemplate } from '../src/loader';

const fixture = (name: string) => path.join(__dirname, 'fixtures', name);

describe('loadTemplate', () => {
    it('loads a SQL file and extracts tokens', () => {
        const result = loadTemplate(fixture('getEvents.sql'));
        expect(result.tokens).toEqual(['tableName', 'status', 'startDate', 'orderBy', 'limit']);
        expect(result.template).toContain('{{tableName}}');
    });

    it('extracts tokens from a simple query', () => {
        const result = loadTemplate(fixture('simple.sql'));
        expect(result.tokens).toEqual(['table', 'id']);
    });

    it('returns empty tokens for a query with no variables', () => {
        const result = loadTemplate(fixture('no-vars.sql'));
        expect(result.tokens).toEqual([]);
        expect(result.template).toContain('SELECT');
    });

    it('deduplicates repeated tokens', () => {
        const result = loadTemplate(fixture('duplicate-vars.sql'));
        expect(result.tokens).toEqual(['table', 'name']);
    });

    it('throws on missing file', () => {
        expect(() => loadTemplate('./nonexistent.sql')).toThrow('File not found');
    });

    it('extracts tokens correctly on sequential calls', () => {
        const result1 = loadTemplate(fixture('simple.sql'));
        const result2 = loadTemplate(fixture('getEvents.sql'));
        const result3 = loadTemplate(fixture('simple.sql'));

        expect(result1.tokens).toEqual(['table', 'id']);
        expect(result2.tokens).toEqual(['tableName', 'status', 'startDate', 'orderBy', 'limit']);
        expect(result3.tokens).toEqual(['table', 'id']);
    });
});
