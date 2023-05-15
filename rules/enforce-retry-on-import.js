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
        const parent = node.parent
        if (parent.type !== 'CallExpression' || parent.callee.name !== 'retry') {
          context.report({
            node,
            message: 'Dynamic import should be wrapped in a retry() call',
          })
        }
      },
    }
  },
}
