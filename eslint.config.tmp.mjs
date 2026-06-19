// TEMPORARY audit config — catches undefined refs / unused vars in the engine layer.
export default [
  {
    files: ["src/**/*.{js,jsx}"],
    ignores: ["src/mocks/**", "node_modules/**"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: "readonly", document: "readonly", console: "readonly",
        requestAnimationFrame: "readonly", cancelAnimationFrame: "readonly",
        localStorage: "readonly", performance: "readonly", navigator: "readonly",
        setTimeout: "readonly", clearTimeout: "readonly", setInterval: "readonly",
        clearInterval: "readonly", Image: "readonly", Audio: "readonly",
        ResizeObserver: "readonly", devicePixelRatio: "readonly",
        Math: "readonly", JSON: "readonly", Date: "readonly", structuredClone: "readonly",
      },
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["warn", { args: "none", varsIgnorePattern: "^_|^React$" }],
      "no-dupe-keys": "error",
      "no-unreachable": "error",
      "no-const-assign": "error",
      "no-self-assign": "error",
      "no-dupe-args": "error",
      "no-cond-assign": "error",
      "no-constant-condition": ["error", { checkLoops: false }],
      "use-isnan": "error",
      "no-fallthrough": "error",
    },
  },
];
