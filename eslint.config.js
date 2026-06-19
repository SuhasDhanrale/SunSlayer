// Flat ESLint config. Scope: the JS/JSX engine layer (systems, renderer,
// obstacles, data, hooks, screens). Core rules only — no plugins — so it catches
// undefined refs, unused vars, dead code, and switch fall-through without adding
// a toolchain. TS entrypoints, the mock lab, scripts, and build config are out of
// scope (not engine logic) and globally ignored below.
export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'webgame-kit/**',
      'src/mocks/**',
      'src/data/PaternsOld',
      '**/*.ts',
      '**/*.tsx',
      'scripts/**',
      '*.config.js',
      '*.config.mjs',
    ],
  },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: 'readonly', document: 'readonly', console: 'readonly',
        requestAnimationFrame: 'readonly', cancelAnimationFrame: 'readonly',
        localStorage: 'readonly', performance: 'readonly', navigator: 'readonly',
        setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly',
        clearInterval: 'readonly', Image: 'readonly', Audio: 'readonly',
        ResizeObserver: 'readonly', devicePixelRatio: 'readonly',
        Math: 'readonly', JSON: 'readonly', Date: 'readonly', structuredClone: 'readonly',
      },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_|^React$' }],
      'no-dupe-keys': 'error',
      'no-unreachable': 'error',
      'no-const-assign': 'error',
      'no-self-assign': 'error',
      'no-dupe-args': 'error',
      'no-cond-assign': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      'use-isnan': 'error',
      'no-fallthrough': 'error',
    },
  },
];
