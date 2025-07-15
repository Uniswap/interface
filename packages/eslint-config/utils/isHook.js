function isHook(node) {
  // Check function declarations
  if (node.type === 'FunctionDeclaration' && node.id?.name) {
    return node.id.name.startsWith('use')
  }

  // Check function expressions and arrow functions assigned to variables
  if (node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
    const parent = node.parent

    // Variable declarator: const useMyHook = () => {}
    if (parent?.type === 'VariableDeclarator' && parent.id?.name) {
      return parent.id.name.startsWith('use')
    }

    // Property assignment: { useMyHook: () => {} }
    if (parent?.type === 'Property' && parent.key?.name) {
      return parent.key.name.startsWith('use')
    }

    // Assignment expression: useMyHook = () => {}
    if (parent?.type === 'AssignmentExpression' && parent.left?.name) {
      return parent.left.name.startsWith('use')
    }
  }

  return false
}

module.exports = { isHook }
