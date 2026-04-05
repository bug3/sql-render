import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...compat.extends('airbnb-base'),
  {
    files: ['**/*.ts'],
    rules: {
      indent: ['error', 4, { SwitchCase: 1 }],
      'import/extensions': 'off',
      'import/no-unresolved': 'off',
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': 'error',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      'import/prefer-default-export': 'off',
      'no-restricted-syntax': ['error', 'ForInStatement', 'LabeledStatement', 'WithStatement'],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '*.config.*'],
  },
);
