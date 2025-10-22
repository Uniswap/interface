'use strict'

const { getParserServices } = require('@typescript-eslint/utils/eslint-utils')
const ts = require('typescript')

/**
 * Check if a TypeScript method declaration contains a 'this' keyword.
 */
function methodUsesThis(tsMethod) {
  let found = false
  function visit(node) {
    if (node.kind === ts.SyntaxKind.ThisKeyword) {
      found = true
      return
    }
    ts.forEachChild(node, visit)
  }
  if (tsMethod.body) {
    visit(tsMethod.body)
  }
  return found
}

/**
 * This rule works for destructured methods from local classes/objects, even if imported,
 * as long as their source is available to the TypeScript program. It will not work for
 * node_modules or .d.ts files (library code).
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: "Prevent destructuring methods that use 'this' which can lead to context loss",
      category: 'Possible Errors',
      recommended: true,
    },
    fixable: undefined, // This rule isn't automatically fixable
    schema: [],
    messages: {
      preventDestructure:
        "Destructuring method '{{name}}' will cause it to lose 'this' context. Use object.{{name}}() instead.",
    },
  },
  create(context) {
    const parserServices = getParserServices(context)
    const typeChecker = parserServices.program.getTypeChecker()

    return {
      "VariableDeclarator[id.type='ObjectPattern']"(node) {
        const objectNode = node.init
        if (!objectNode) {
          return
        }

        try {
          const tsNode = parserServices.esTreeNodeToTSNodeMap.get(objectNode)
          const type = typeChecker.getTypeAtLocation(tsNode)
          const properties = type.getProperties()

          for (const prop of node.id.properties) {
            if (prop.type !== 'Property') {
              continue
            }
            const propertyName = prop.key.name
            const symbol = properties.find((s) => s.getName() === propertyName)
            if (!symbol) {
              continue
            }

            const declarations = symbol.getDeclarations() || []
            for (const decl of declarations) {
              // Check method declarations (method() { ... })
              if (
                ts.isMethodDeclaration(decl) &&
                decl.body &&
                !decl.getSourceFile().isDeclarationFile &&
                methodUsesThis(decl)
              ) {
                context.report({
                  node: prop,
                  messageId: 'preventDestructure',
                  data: { name: propertyName },
                })
                break
              }
              // Check property assignments with function expressions (method: function() { ... })
              if (
                ts.isPropertyAssignment(decl) &&
                ts.isFunctionExpression(decl.initializer) &&
                decl.initializer.body &&
                !decl.getSourceFile().isDeclarationFile &&
                methodUsesThis(decl.initializer)
              ) {
                context.report({
                  node: prop,
                  messageId: 'preventDestructure',
                  data: { name: propertyName },
                })
                break
              }
            }
          }
        } catch {
          // Handle type resolution errors
        }
      },
    }
  },
}
