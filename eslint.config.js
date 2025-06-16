import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import { fixupConfigAsPlugin } from "@eslint/compat";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactRefresh from "eslint-plugin-react-refresh";
import tsEslint from "typescript-eslint";

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      parser: tsEslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json", // Important for type-aware linting
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react: fixupConfigAsPlugin(pluginReactConfig),
      "react-hooks": pluginReactHooks,
      "react-refresh": pluginReactRefresh,
      "@typescript-eslint": tsEslint.plugin,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...pluginReactConfig.rules,
      ...pluginReactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // Disable the base JS no-unused-vars rule as we'll use the TypeScript one
      "no-unused-vars": "off",
      // Configure the TypeScript no-unused-vars rule to ignore variables starting with '_'
      "@typescript-eslint/no-unused-vars": [
        "warn", // Change to 'warn' so it doesn't break the build
        {
          argsIgnorePattern: "^_", // Ignore unused arguments starting with _
          varsIgnorePattern: "^_", // Ignore unused variables starting with _
          caughtErrorsIgnorePattern: "^_", // Ignore unused caught errors starting with _
        },
      ],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];