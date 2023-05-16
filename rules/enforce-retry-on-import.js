/* eslint-env node */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'enforce use of retry() for dynamic imports',
      category: 'Best Practices',
      recommended: false,
    },
    schema: [], // no options
  },
  create(context) {
    return {
      ImportExpression(node) {
        const grandParent = node.parent.parent
        if (
          !(
            grandParent &&
            grandParent.type === 'CallExpression' &&
            grandParent.callee.name === 'retry' &&
            grandParent.arguments.length === 1 &&
            grandParent.arguments[0].type === 'ArrowFunctionExpression'
          )
        ) {
          context.report({
            node,
            message: 'Dynamic import should be wrapped in the pattern retry(() => import(...))',
          })
        }
      },
    }
  },
}
