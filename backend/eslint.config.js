import js from "@eslint/js";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      sourceType: "module",
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir
      }
    },
    rules: {
      "no-console": "off"
    }
  }
];
