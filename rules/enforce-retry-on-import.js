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
        let currentNode = node
        while (currentNode) {
          if (currentNode.type === 'CallExpression' && currentNode.callee.name === 'retry') {
            return // Found a retry() call, so no problem
          }
          currentNode = currentNode.parent
        }
        // If we got here, no retry() call was found
        context.report({
          node,
          message: 'Dynamic import should be wrapped in a retry() call',
        })
      },
    }
  },
}
