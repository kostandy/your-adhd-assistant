import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'node_modules/**']
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        ...globals.es2022
      }
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.mjs']
        }
      }
    },
    rules: {
      'import/no-unresolved': 'off',
      'no-console': ['warn', { allow: ['error', 'warn', 'info'] }]
    }
  }
];