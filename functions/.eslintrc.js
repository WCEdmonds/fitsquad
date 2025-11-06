module.exports = {
  // This tells ESLint to stop looking in parent folders
  root: true,

  // Set the parser to understand TypeScript
  parser: "@typescript-eslint/parser",

  // Tell the parser to look for your tsconfig.json
  parserOptions: {
    project: "./tsconfig.json",
    sourceType: "module",
    ecmaVersion: 2020,
  },

  // Specify the environment
  env: {
    node: true,
    es6: true,
  },

  // Add the plugins
  plugins: [
    "@typescript-eslint",
    "import",
    "promise",
  ],

  // Start with these recommended rule sets
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/typescript",
    "plugin:promise/recommended",
  ],
  ignorePatterns: [
    ".eslintrc.js",
    "lib/",
    "node_modules/"
  ],

  // Add your own custom rules here
  rules: {
    // --- RELAXED STYLE RULES ---
    "max-len": "off", // Turn off max-length errors
    "object-curly-spacing": "off", // Turn off curly spacing errors
    "padded-blocks": "off", // Turn off padding errors
    "no-trailing-spaces": "off", // Turn off trailing space errors
    "eol-last": "off", // Turn off newline-at-end-of-file error

    // --- STYLE PREFERENCES ---
    "quotes": ["error", "double"], // Enforce double quotes

    // --- CODE QUALITY RULES (Keep these) ---
    "no-console": "warn", // Warn about console.log
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "import/no-unresolved": "off",
    "promise/always-return": "error",
    "@typescript-eslint/no-non-null-assertion": "off",
  },
};