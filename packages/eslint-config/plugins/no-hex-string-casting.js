'use strict'

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow manual casting to 0x{string} type',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noHexStringCasting: 'Avoid manual casting to "0x{string}". Use isValidHexString() function instead.',
    },
  },

  create(context) {
    return {
      TSTypeAssertion(node) {
        if (isHexStringTypeAssertion(node)) {
          context.report({
            node,
            messageId: 'noHexStringCasting',
          })
        }
      },
      TSAsExpression(node) {
        if (isHexStringTypeAssertion(node)) {
          context.report({
            node,
            messageId: 'noHexStringCasting',
          })
        }
      },
    }
  },
}

function isHexStringTypeAssertion(node) {
  const typeAnnotation = node.typeAnnotation

  // Check for template literal type like `0x${string}`
  if (typeAnnotation && typeAnnotation.type === 'TSTemplateLiteralType') {
    const { quasis, types } = typeAnnotation

    // Check if it matches the pattern `0x${string}`
    if (
      quasis.length === 2 &&
      quasis[0].value.raw === '0x' &&
      quasis[1].value.raw === '' &&
      types.length === 1 &&
      types[0].type === 'TSStringKeyword'
    ) {
      return true
    }
  }

  return false
}
