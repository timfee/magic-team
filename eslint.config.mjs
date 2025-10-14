import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import tseslint from "typescript-eslint";
import { fileURLToPath } from "url";

import { defineConfig } from "eslint/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "functions/**",
      "*.config.mjs",
      "*.config.js",
      "next-env.d.ts",
    ],
  },
  {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { projectService: true },
    },
    rules: {
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
];

export default defineConfig(eslintConfig);
