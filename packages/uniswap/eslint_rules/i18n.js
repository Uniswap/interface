const { ESLintUtils } = require('@typescript-eslint/utils')

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce proper i18next translation interpolation usage',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      cannotBeUndefined:
        'i18n "{{translationKey}}" cannot have an undefined interpolation. Either provide a fallback or do not render.' +
        '\n {{argType}}',
    },
  },

  create(context) {
    const services = ESLintUtils.getParserServices(context)
    const checker = services.program.getTypeChecker()

    return {
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 't' && node.arguments.length > 1) {
          const firstArg = node.arguments[0]
          const secondArg = node.arguments[1]
          if (secondArg.type === 'ObjectExpression') {
            const tsNode = services.esTreeNodeToTSNodeMap.get(secondArg)
            const type = checker.getTypeAtLocation(tsNode)
            const typeString = checker.typeToString(type)
            if (typeString.includes('undefined')) {
              context.report({
                node: node.callee,
                messageId: 'cannotBeUndefined',
                data: { argType: typeString, translationKey: firstArg.value },
              })
            }
          }
        }
      },
    }
  },
}
