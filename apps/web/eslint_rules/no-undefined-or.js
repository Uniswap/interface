/* eslint-env node */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce the use of optional object fields',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {
    return {
      'TSPropertySignature > TSTypeAnnotation > TSUnionType': (node) => {
        const types = node.types
        const hasUndefined = types.some((typeNode) => typeNode.type === 'TSUndefinedKeyword')

        if (hasUndefined) {
          const typesWithoutUndefined = types.filter((typeNode) => typeNode.type !== 'TSUndefinedKeyword')

          // If there is more than one type left after removing 'undefined',
          // join them together with ' | ' to create a new union type.
          const newTypeSource =
            typesWithoutUndefined.length > 1
              ? typesWithoutUndefined.map((typeNode) => context.getSourceCode().getText(typeNode)).join(' | ')
              : context.getSourceCode().getText(typesWithoutUndefined[0])

          context.report({
            node,
            message: `Prefer optional properties to "Type | undefined".`,
            fix(fixer) {
              const propertySignature = node.parent.parent
              const isAlreadyOptional = propertySignature.optional
              const newTypeAnnotation = isAlreadyOptional ? `: ${newTypeSource}` : `?: ${newTypeSource}`
              return fixer.replaceText(node.parent, newTypeAnnotation)
            },
          })
        }
      },
    }
  },
}
