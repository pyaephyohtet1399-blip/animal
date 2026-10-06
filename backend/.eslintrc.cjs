module.exports = {
  env: { node: true, es2022: true, jest: true },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 2022, sourceType: 'script' },
  overrides: [
    {
      files: ['tests/load/**/*.js'],
      parserOptions: { sourceType: 'module' },
      globals: { __ENV: 'readonly' }
    }
  ],
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^next$', ignoreRestSiblings: true }],
    'no-console': 'error'
  },
  ignorePatterns: ['node_modules/', 'coverage/', 'logs/']
};
