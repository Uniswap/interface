'use strict'

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow percentage strings in translateX/translateY transforms',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noPercentageTransform:
        'Percentage strings like "{{value}}" are not allowed in {{property}}. ' +
        'Use numeric pixel values instead. ' +
        'Percentage transforms cause React Native crashes on Android.',
    },
  },

  create(context) {
    /**
     * Check if a node represents a percentage string literal
     */
    function isPercentageLiteral(node) {
      // eslint-disable-next-line security/detect-unsafe-regex
      return node.type === 'Literal' && typeof node.value === 'string' && /^-?\d+(\.\d+)?%$/.test(node.value)
    }

    /**
     * Check if a template literal will produce a percentage string
     */
    function isPercentageTemplateLiteral(node) {
      if (node.type !== 'TemplateLiteral') {
        return false
      }
      // Check if the last quasi ends with %
      const lastQuasi = node.quasis[node.quasis.length - 1]
      return lastQuasi && lastQuasi.value.raw.endsWith('%')
    }

    /**
     * Check if a property is translateX or translateY
     */
    function isTransformProperty(property) {
      return (
        property.type === 'Property' &&
        property.key.type === 'Identifier' &&
        (property.key.name === 'translateX' || property.key.name === 'translateY')
      )
    }

    /**
     * Process a transform object: { translateX: '40%' }
     */
    function checkTransformObject(node) {
      if (node.type !== 'ObjectExpression') {
        return
      }

      for (const property of node.properties) {
        if (isTransformProperty(property)) {
          const value = property.value
          if (isPercentageLiteral(value) || isPercentageTemplateLiteral(value)) {
            context.report({
              node: value,
              messageId: 'noPercentageTransform',
              data: {
                property: property.key.name,
                value: getValueString(value),
              },
            })
          }
        }
      }
    }

    /**
     * Process a transform array: [{ translateX: '40%' }, { translateY: '50%' }]
     */
    function checkTransformArray(node) {
      if (node.type !== 'ArrayExpression') {
        return
      }

      for (const element of node.elements) {
        if (element) {
          checkTransformObject(element)
        }
      }
    }

    /**
     * Get a string representation of a value for error messages
     */
    function getValueString(node) {
      if (node.type === 'Literal') {
        return String(node.value)
      }
      if (node.type === 'TemplateLiteral') {
        return '<template>%'
      }
      return '<unknown>%'
    }

    /**
     * Check if node is inside a JSX context
     */
    function isInJSXContext(node) {
      let parent = node.parent
      while (parent) {
        if (parent.type === 'JSXExpressionContainer') {
          return true
        }
        parent = parent.parent
      }
      return false
    }

    return {
      /**
       * Catch pattern 1: style={{ transform: [...] }}
       * Catch pattern 2: StyleSheet.create({ foo: { transform: [...] } })
       * Note: Skip if inside JSX to avoid duplicate reporting (handled by JSXAttribute)
       */
      Property(node) {
        // Skip if we're in JSX context - let JSXAttribute handle it
        if (isInJSXContext(node)) {
          return
        }

        // Check if this is a 'transform' property
        if (node.key.type === 'Identifier' && node.key.name === 'transform' && node.value.type === 'ArrayExpression') {
          checkTransformArray(node.value)
        }

        // Also check if this is a 'style' property containing transform
        if (node.key.type === 'Identifier' && node.key.name === 'style' && node.value.type === 'ObjectExpression') {
          // Look for transform property inside style object
          for (const prop of node.value.properties) {
            if (
              prop.type === 'Property' &&
              prop.key.type === 'Identifier' &&
              prop.key.name === 'transform' &&
              prop.value.type === 'ArrayExpression'
            ) {
              checkTransformArray(prop.value)
            }
          }
        }
      },

      /**
       * Catch pattern 3: JSX transform prop
       * <Flex transform={[{ translateX: '40%' }]} />
       */
      JSXAttribute(node) {
        if (
          node.name.type === 'JSXIdentifier' &&
          node.name.name === 'transform' &&
          node.value &&
          node.value.type === 'JSXExpressionContainer'
        ) {
          const expression = node.value.expression
          checkTransformArray(expression)
        }

        // Also check style prop with JSX
        if (
          node.name.type === 'JSXIdentifier' &&
          node.name.name === 'style' &&
          node.value &&
          node.value.type === 'JSXExpressionContainer'
        ) {
          const expression = node.value.expression
          if (expression.type === 'ObjectExpression') {
            for (const prop of expression.properties) {
              if (
                prop.type === 'Property' &&
                prop.key.type === 'Identifier' &&
                prop.key.name === 'transform' &&
                prop.value.type === 'ArrayExpression'
              ) {
                checkTransformArray(prop.value)
              }
            }
          }
        }
      },
    }
  },
}
