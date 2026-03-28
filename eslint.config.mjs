import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // shadcn/ui auto-generated components — not hand-written, skip linting
    "src/components/ui/**",
  ]),
  // Must be last — disables all ESLint formatting rules that would
  // conflict with Prettier. Prettier is the sole authority on formatting.
  prettier,
]);

export default eslintConfig;
