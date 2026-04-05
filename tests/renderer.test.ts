import { describe, it, expect } from 'vitest';
import { render } from '../src/renderer';

describe('render', () => {
  it('replaces a single token', () => {
    const result = render('SELECT * FROM {{table}}', { table: 'users' });
    expect(result).toBe('SELECT * FROM users');
  });

  it('replaces multiple different tokens', () => {
    const template = 'SELECT * FROM {{table}} WHERE id = {{id}}';
    const result = render(template, { table: 'users', id: '42' });
    expect(result).toBe('SELECT * FROM users WHERE id = 42');
  });

  it('replaces multiple occurrences of the same token', () => {
    const template = "SELECT * FROM {{t}} WHERE name = '{{name}}' OR alias = '{{name}}'";
    const result = render(template, { t: 'users', name: 'john' });
    expect(result).toBe("SELECT * FROM users WHERE name = 'john' OR alias = 'john'");
  });

  it('returns template unchanged when no tokens exist', () => {
    const template = 'SELECT 1';
    const result = render(template, {});
    expect(result).toBe('SELECT 1');
  });

  it('handles empty values', () => {
    const result = render('SELECT * FROM {{table}}', { table: '' });
    expect(result).toBe('SELECT * FROM ');
  });
});
