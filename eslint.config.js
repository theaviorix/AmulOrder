import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginUnusedImports from "eslint-plugin-unused-imports";

const files = [
  "src/components/**/*.{js,mjs,cjs,jsx}",
  "src/pages/**/*.{js,mjs,cjs,jsx}",
  "src/Layout.jsx",
];
const ignores = ["src/lib/**/*", "src/components/ui/**/*"];

export default [
  // Spreading these configs' `rules` into the object below (as the old
  // code did) meant the later `rules: {...}` key silently replaced them
  // instead of merging — eslint:recommended and the React recommended
  // rules (including no-undef) were never actually active. Keeping them
  // as their own config entries so they layer instead of getting clobbered.
  { ...pluginJs.configs.recommended, files, ignores },
  { ...pluginReact.configs.flat.recommended, files, ignores },
  {
    files,
    ignores,
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      "no-unused-vars": "off",
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/no-unknown-property": [
        "error",
        { ignore: ["cmdk-input-wrapper", "toast-close"] },
      ],
      "react-hooks/rules-of-hooks": "error",
    },
  },
];
