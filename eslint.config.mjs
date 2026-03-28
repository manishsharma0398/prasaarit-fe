import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // shadcn/ui auto-generated components — not hand-written, skip linting
    'src/components/ui/**',
  ]),
  {
    rules: {
      // Enforce arrow functions for named React components
      // e.g. const MyComponent = () => <div /> — not function MyComponent() {}
      'react/function-component-definition': ['error', { namedComponents: 'arrow-function' }],

      // Detect circular imports — max depth 1 for fast static analysis
      // Circular deps cause hard-to-debug runtime errors and bundle issues
      'import/no-cycle': ['error', { maxDepth: 1 }],

      // Prevent direct mutation of function parameters
      // Exception: Immer draft and Redux state slices (reducer pattern)
      'no-param-reassign': [
        'error',
        {
          props: true,
          ignorePropertyModificationsFor: ['draft', 'state'],
        },
      ],
    },
  },
  // Must be last — disables all ESLint formatting rules that would
  // conflict with Prettier. Prettier is the sole authority on formatting.
  prettier,
]);

export default eslintConfig;
