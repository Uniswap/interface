import { TSESLint } from '@typescript-eslint/experimental-utils';
import rule from './enforce-retry-on-import';

const ruleTester = new TSESLint.RuleTester({
  parser: '@typescript-eslint/parser',
});

const errorMessage = 'Dynamic import should be wrapped in the pattern retry(() => import(...))';

ruleTester.run('enforce-retry-on-import', rule, {
  valid: [
    {
      code: 'retry(() => import("./module"))',
    },
  ],
  invalid: [
    {
      code: 'import("./module")',
      errors: [{ messageId: 'missingRetry', message: errorMessage }],
    },
  ],
});
