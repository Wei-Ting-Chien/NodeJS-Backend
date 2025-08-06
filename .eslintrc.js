module.exports = {
  env: {
    node: true,
    es2021: true,
    mocha: true,
  },
  extends: ['eslint:recommended', 'plugin:node/recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  plugins: ['node'],
  rules: {
    // General rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',

    // Node.js specific rules
    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-missing-import': 'off',
    'node/no-unpublished-import': 'off',
    'node/no-unpublished-require': 'off',

    // Mocha/Testing rules
    'no-undef': 'off', // Allow global describe, it, expect

    // Code style
    indent: ['error', 2],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
  },
  overrides: [
    {
      files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
      env: {
        mocha: true,
      },
      globals: {
        expect: 'readonly',
        sinon: 'readonly',
        testUtils: 'readonly',
      },
      rules: {
        'no-console': 'off',
        'no-undef': 'off',
      },
    },
  ],
};
