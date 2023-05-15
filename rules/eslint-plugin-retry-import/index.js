module.exports = {
  rules: {
    'enforce-retry-on-import': {
      meta: {
        type: 'problem',
        docs: {
          description: 'enforce use of retry() for dynamic imports',
          category: 'Best Practices',
          recommended: false,
        },
        schema: [],  // no options
      },
      create: function(context) {
        return {
          'ImportExpression': function(node) {
            const parent = node.parent;
            if (parent.type !== 'CallExpression' || parent.callee.name !== 'retry') {
              context.report({
                node: node,
                message: 'Dynamic import should be wrapped in a retry() call',
              });
            }
          },
        };
      },
    },
  },
};
