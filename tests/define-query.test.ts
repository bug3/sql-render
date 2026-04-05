import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { defineQuery } from '../src/index';

const fixture = (name: string) => path.join(__dirname, 'fixtures', name);

describe('defineQuery', () => {
  it('renders a full query with all parameters', () => {
    const getEvents = defineQuery<{
      tableName: string;
      status: string;
      startDate: string;
      orderBy: string;
      limit: number;
    }>(fixture('getEvents.sql'));

    const { sql } = getEvents({
      tableName: 'prod_events',
      status: 'active',
      startDate: '2024-01-01',
      orderBy: 'created_at',
      limit: 100,
    });

    expect(sql).toContain('FROM prod_events');
    expect(sql).toContain("status = 'active'");
    expect(sql).toContain("created_at >= '2024-01-01'");
    expect(sql).toContain('ORDER BY created_at');
    expect(sql).toContain('LIMIT 100');
  });

  it('renders a simple query', () => {
    const query = defineQuery<{ table: string; id: number }>(fixture('simple.sql'));
    const { sql } = query({ table: 'users', id: 42 });
    expect(sql).toBe('SELECT * FROM users WHERE id = 42\n');
  });

  it('handles a query with no variables', () => {
    const query = defineQuery<Record<string, never>>(fixture('no-vars.sql'));
    const { sql } = query({} as Record<string, never>);
    expect(sql).toBe('SELECT 1\n');
  });

  it('handles duplicate tokens — same value applied to all occurrences', () => {
    const query = defineQuery<{ table: string; name: string }>(
      fixture('duplicate-vars.sql'),
    );
    const { sql } = query({ table: 'users', name: 'john' });
    expect(sql).toBe("SELECT * FROM users WHERE name = 'john' OR alias = 'john'\n");
  });

  describe('error handling', () => {
    it('throws on missing file', () => {
      expect(() => defineQuery('./nonexistent.sql')).toThrow('File not found');
    });

    it('throws when params are missing', () => {
      const query = defineQuery<{ table: string; id: number }>(fixture('simple.sql'));
      expect(() => query({ table: 'users' } as { table: string; id: number })).toThrow(
        'Missing variables in params: [id]',
      );
    });

    it('throws when extra params are provided', () => {
      const query = defineQuery<{ table: string; id: number }>(fixture('simple.sql'));
      const params = { table: 'users', id: 1, foo: 'bar' } as unknown as { table: string; id: number };
      expect(() => query(params)).toThrow('Extra variables not in template: [foo]');
    });

    it('throws on SQL injection in string values', () => {
      const query = defineQuery<{ table: string; id: number }>(fixture('simple.sql'));
      expect(() => query({ table: 'users; DROP TABLE users', id: 1 })).toThrow(
        'SQL injection pattern detected',
      );
    });

    it('throws on NaN number value', () => {
      const query = defineQuery<{ table: string; id: number }>(fixture('simple.sql'));
      expect(() => query({ table: 'users', id: NaN })).toThrow('expected a finite number');
    });

    it('throws on null value', () => {
      const query = defineQuery<{ table: string; id: number }>(fixture('simple.sql'));
      const params = { table: 'users', id: null } as unknown as { table: string; id: number };
      expect(() => query(params)).toThrow('cannot be null or undefined');
    });
  });

  describe('custom validators', () => {
    it('applies custom validator per key', () => {
      const query = defineQuery<{ table: string; id: number }>(fixture('simple.sql'));

      const { sql } = query(
        { table: 'prod_users', id: 1 },
        { validators: { table: (val) => typeof val === 'string' && val.startsWith('prod_') } },
      );

      expect(sql).toContain('FROM prod_users');
    });

    it('throws when custom validator fails', () => {
      const query = defineQuery<{ table: string; id: number }>(fixture('simple.sql'));
      const opts = { validators: { table: (val: unknown) => typeof val === 'string' && val.startsWith('prod_') } };
      expect(() => query({ table: 'staging_users', id: 1 }, opts)).toThrow('Custom validation failed');
    });

    it('custom validator bypasses built-in SQL injection checks', () => {
      const query = defineQuery<{ table: string; id: number }>(fixture('simple.sql'));

      const { sql } = query(
        { table: 'users -- safe', id: 1 },
        { validators: { table: () => true } },
      );

      expect(sql).toContain('FROM users -- safe');
    });
  });

  it('escapes single quotes in string values', () => {
    const query = defineQuery<{ table: string; name: string }>(
      fixture('duplicate-vars.sql'),
    );
    const { sql } = query({ table: 'users', name: "O'Brien" });
    expect(sql).toContain("O''Brien");
  });
});
