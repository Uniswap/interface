/* eslint-env node */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'enforce use of retry() for dynamic imports',
      category: 'Best Practices',
      recommended: false,
    },
    schema: [],
  },
  create(context) {
    return {
      ImportExpression(node) {
        const grandParent = node.parent.parent
        if (
          !(
            grandParent &&
            grandParent.type === 'CallExpression' &&
            // Technically, we are only checking that a function named `retry` wraps the dynamic import.
            // We do not go as far as enforcing that it is import('utils/retry').retry
            grandParent.callee.name === 'retry' &&
            grandParent.arguments.length === 1 &&
            grandParent.arguments[0].type === 'ArrowFunctionExpression'
          )
        ) {
          context.report({
            node,
            message: 'Dynamic import should be wrapped in retry (see `utils/retry.ts`): `retry(() => import(...))`',
          })
        }
      },
    }
  },
}
