'use strict'

const { isHook } = require('../utils/isHook')

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce using QueryOptionsResult type for functions returning query options',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          importPath: {
            type: 'string',
            default: 'utilities/src/reactQuery/queryOptions',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      useQueryOptionsResult: 'Use QueryOptionsResult type instead of {{actualType}} for query option return types',
    },
  },

  create(context) {
    const options = context.options[0] || {}
    const importPath = options.importPath || 'utilities/src/reactQuery/queryOptions'
    const sourceCode = context.getSourceCode()

    // Track imports state
    let hasQueryOptionsResultImport = false
    let existingImportNode = null

    // Track processed functions to avoid duplicate reports
    const processedFunctions = new WeakSet()

    // Use Set for O(1) lookup performance
    const prohibitedTypes = new Set(['UseQueryOptions', 'UseQueryResult', 'QueryOptions'])

    function checkFunctionReturnType(node) {
      // Skip if already processed
      if (processedFunctions.has(node)) {
        return
      }
      processedFunctions.add(node)

      // Early return if no return type annotation
      if (!node.returnType?.typeAnnotation) {
        return
      }

      // Skip hooks (functions whose names start with "use")
      if (isHook(node)) {
        return
      }

      const typeAnnotation = node.returnType.typeAnnotation

      // Only check TSTypeReference nodes
      if (typeAnnotation.type !== 'TSTypeReference' || !typeAnnotation.typeName) {
        return
      }

      const typeName =
        typeAnnotation.typeName.type === 'Identifier'
          ? typeAnnotation.typeName.name
          : sourceCode.getText(typeAnnotation.typeName)

      if (prohibitedTypes.has(typeName)) {
        context.report({
          node: node.returnType,
          messageId: 'useQueryOptionsResult',
          data: { actualType: typeName },
          fix(fixer) {
            const fixes = [fixer.replaceText(typeAnnotation.typeName, 'QueryOptionsResult')]

            // Add import if needed
            if (!hasQueryOptionsResultImport) {
              fixes.push(...getImportFix(fixer))
            }

            return fixes
          },
        })
      }
    }

    function getImportFix(fixer) {
      if (existingImportNode) {
        // Add to existing import from correct path
        const lastSpecifier = existingImportNode.specifiers[existingImportNode.specifiers.length - 1]
        return [fixer.insertTextAfter(lastSpecifier, ', QueryOptionsResult')]
      }

      // Add new import at the top
      const insertText = `import { QueryOptionsResult } from '${importPath}'\n`
      const firstImport = sourceCode.ast.body.find((node) => node.type === 'ImportDeclaration')

      return [
        firstImport ? fixer.insertTextBefore(firstImport, insertText) : fixer.insertTextBeforeRange([0, 0], insertText),
      ]
    }

    return {
      ImportDeclaration(node) {
        const importValue = node.source?.value
        if (!importValue) {
          return
        }

        // Check if this import is from our utilities path
        if (
          importValue.includes('reactQuery/queryOptions') ||
          importValue.includes('utilities/src/reactQuery') ||
          importValue.includes('utilities/reactQuery')
        ) {
          existingImportNode = node

          // Check if QueryOptionsResult is already imported
          const hasQueryOptionsResult = node.specifiers.some(
            (spec) => spec.type === 'ImportSpecifier' && spec.imported.name === 'QueryOptionsResult',
          )
          if (hasQueryOptionsResult) {
            hasQueryOptionsResultImport = true
          }
        }
      },

      FunctionDeclaration(node) {
        checkFunctionReturnType(node)
      },

      FunctionExpression(node) {
        checkFunctionReturnType(node)
      },

      ArrowFunctionExpression(node) {
        checkFunctionReturnType(node)
      },

      // Check exported functions
      ExportNamedDeclaration(node) {
        if (!node.declaration) {
          return
        }

        if (node.declaration.type === 'FunctionDeclaration') {
          checkFunctionReturnType(node.declaration)
        } else if (node.declaration.type === 'VariableDeclaration') {
          node.declaration.declarations.forEach((decl) => {
            if (decl.init?.type === 'FunctionExpression' || decl.init?.type === 'ArrowFunctionExpression') {
              checkFunctionReturnType(decl.init)
            }
          })
        }
      },
    }
  },
}
