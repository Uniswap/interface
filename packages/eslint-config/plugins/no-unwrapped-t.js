const TRANSLATION_COMPONENT_NAME = 'Trans'

function getElementName(node) {
  let curr = node.openingElement.name

  // traverse to identifier
  while (curr.type === 'JSXMemberExpression') {
    if (curr.property.type === 'JSXIdentifier') {
      return curr.property.name
    } else {
      curr = curr.object
    }
  }

  return curr.name
}

function getNearestJSXAncestorName(node) {
  let curNode = node

  while (curNode) {
    // find the closest JSXElement ancestor
    if (curNode.type === 'JSXElement') {
      const name = getElementName(curNode)

      // skip translation component
      if (name !== TRANSLATION_COMPONENT_NAME) {
        return name
      }
    }
    curNode = curNode.parent
  }

  // no JSXElement ancestor found
  return undefined
}

function create(context) {
  const { blockedElements } = context.options[0] || {}

  const reportIfBlocked = ({ node, childName }) => {
    const nearestJSXAncestorName = getNearestJSXAncestorName(node)

    if (blockedElements.includes(nearestJSXAncestorName)) {
      context.report({
        node,
        message: `${childName} should not be a direct child of ${nearestJSXAncestorName}; please wrap it in <Text/>.`,
      })
    }
  }

  return {
    JSXExpressionContainer(node) {
      const isTranslatedExpression = node.expression?.callee?.name === 't'

      if (!isTranslatedExpression) {
        return
      }

      // ignore if it's in an attribute (eg <Component prop={t()} />)
      if (node.parent.type === 'JSXAttribute') {
        return
      }

      reportIfBlocked({ node, childName: 't()' })
    },

    JSXIdentifier(node) {
      const { name } = node
      if (name !== TRANSLATION_COMPONENT_NAME) {
        return
      }

      reportIfBlocked({ node, childName: TRANSLATION_COMPONENT_NAME })
    },
  }
}

module.exports = {
  meta: {
    schema: [
      {
        type: 'object',
        properties: {
          blockedElements: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create,
}
