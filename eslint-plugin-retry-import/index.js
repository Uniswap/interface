module.exports = {
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
