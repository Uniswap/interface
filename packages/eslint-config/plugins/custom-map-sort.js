function getMapKeys(node) {
  return node.arguments[0]?.elements
    ?.map((element) => {
      if (element?.type === 'ArrayExpression' && element?.elements?.length > 0) {
        const keyElement = element?.elements?.[0]
        if (keyElement.type === 'MemberExpression' && keyElement.property.type === 'Identifier') {
          return keyElement.property.name
        } else if (keyElement.type === 'Identifier') {
          return keyElement.name
        } else if (keyElement.type === 'Literal') {
          return keyElement.value
        }
      }
      return undefined
    })
    .filter((key) => key !== undefined)
}

function create(context) {
  return {
    NewExpression(node) {
      if (node.callee.name !== 'Map') {
        return
      }

      const keys = getMapKeys(node)

      // Check if keys are iterable
      if (!Array.isArray(keys)) {
        return
      }

      const sortedKeys = [...keys].sort()

      if (keys.join(',') !== sortedKeys.join(',')) {
        context.report({
          node,
          message: `Map keys should be sorted alphabetically. Correct order: ${sortedKeys.join(', ')}`,
        })
      }
    },
  }
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce alphabetical sorting of Map keys',
      category: 'Stylistic Issues',
      recommended: false,
    },
    schema: [], // no options
  },
  create,
}
