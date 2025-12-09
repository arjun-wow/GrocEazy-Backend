import tseslint from "typescript-eslint";
import eslintPluginPrettier from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier";
import sonarjs from "eslint-plugin-sonarjs";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{ts,tsx,js,jsx}"],

    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
      },
      globals: {
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
      },
    },

    plugins: {
      "@typescript-eslint": tseslint.plugin,
      sonarjs,
      prettier: eslintPluginPrettier,
    },

    extends: [
      "eslint:recommended",
      ...tseslint.configs.recommended,
      "plugin:sonarjs/recommended",
      eslintConfigPrettier, // turns off conflicting rules
    ],

    rules: {
      // ▶ MATCH FRONTEND RULE STYLE
      "no-console": "error",
      "no-debugger": "error",
      eqeqeq: ["error", "always"],
      curly: "error",
      "prefer-const": "error",
      "no-multiple-empty-lines": ["warn", { max: 1 }],
      "arrow-spacing": ["error", { before: true, after: true }],
      "comma-dangle": ["error", "always-multiline"],

      // ▶ TYPESCRIPT RULES (match frontend)
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": "error",

      // ▶ PRETTIER ENFORCEMENT
      "prettier/prettier": "error",

      // ▶ BACKEND-SPECIFIC QUALITY RULES (from your old config)
      complexity: ["warn", { max: 10 }],
      "max-lines": ["warn", 300],
      "max-depth": ["warn", 4],
      "max-params": ["warn", 4],
    },

    ignores: ["dist", "node_modules"],
  },
]);
