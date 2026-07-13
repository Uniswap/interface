/**
 * Custom oxlint JS plugin — ports ESLint local-rules and rulesdir rules.
 *
 * Covers all non-type-aware custom rules. The 2 type-aware rules
 * (prevent-this-method-destructure, i18n) remain in ESLint until
 * oxlint supports type-aware JS plugins.
 */

import { readFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

// ── Utilities ──────────────────────────────────────────────────────────

function isHook(node) {
  if (node.type === 'FunctionDeclaration' && node.id?.name) {
    return node.id.name.startsWith('use')
  }
  if (node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
    const parent = node.parent
    if (parent?.type === 'VariableDeclarator' && parent.id?.name) {
      return parent.id.name.startsWith('use')
    }
    if (parent?.type === 'Property' && parent.key?.name) {
      return parent.key.name.startsWith('use')
    }
    if (parent?.type === 'AssignmentExpression' && parent.left?.name) {
      return parent.left.name.startsWith('use')
    }
  }
  return false
}

// ── no-unwrapped-t ─────────────────────────────────────────────────────

const noUnwrappedT = {
  meta: {
    schema: [
      {
        type: 'object',
        properties: {
          blockedElements: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const TRANSLATION_COMPONENT_NAME = 'Trans'
    const { blockedElements } = context.options[0] || {}

    function getElementName(node) {
      let curr = node.openingElement.name
      while (curr.type === 'JSXMemberExpression') {
        if (curr.property.type === 'JSXIdentifier') {
          return curr.property.name
        }
        curr = curr.object
      }
      return curr.name
    }

    function getNearestJSXAncestorName(node) {
      let curNode = node
      while (curNode) {
        if (curNode.type === 'JSXElement') {
          const name = getElementName(curNode)
          if (name !== TRANSLATION_COMPONENT_NAME) {
            return name
          }
        }
        curNode = curNode.parent
      }
      return undefined
    }

    const reportIfBlocked = ({ node, childName }) => {
      const nearestJSXAncestorName = getNearestJSXAncestorName(node)
      if (blockedElements?.includes(nearestJSXAncestorName)) {
        context.report({
          node,
          message: `${childName} should not be a direct child of ${nearestJSXAncestorName}; please wrap it in <Text/>.`,
        })
      }
    }

    return {
      JSXExpressionContainer(node) {
        if (node.expression?.callee?.name !== 't') {
          return
        }
        if (node.parent.type === 'JSXAttribute') {
          return
        }
        reportIfBlocked({ node, childName: 't()' })
      },
      JSXIdentifier(node) {
        if (node.name !== TRANSLATION_COMPONENT_NAME) {
          return
        }
        reportIfBlocked({ node, childName: TRANSLATION_COMPONENT_NAME })
      },
    }
  },
}

// ── custom-map-sort ────────────────────────────────────────────────────

const customMapSort = {
  meta: {
    type: 'suggestion',
    docs: { description: 'enforce alphabetical sorting of Map keys' },
    schema: [],
  },
  create(context) {
    function getMapKeys(node) {
      return node.arguments[0]?.elements
        ?.map((element) => {
          if (element?.type === 'ArrayExpression' && element?.elements?.length > 0) {
            const keyElement = element.elements[0]
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

    return {
      NewExpression(node) {
        if (node.callee.name !== 'Map') {
          return
        }
        const keys = getMapKeys(node)
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
  },
}

// ── no-hex-string-casting ──────────────────────────────────────────────

function isHexStringTypeAssertion(node) {
  const typeAnnotation = node.typeAnnotation
  if (typeAnnotation && typeAnnotation.type === 'TSTemplateLiteralType') {
    const { quasis, types } = typeAnnotation
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

const noHexStringCasting = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      noHexStringCasting: 'Avoid manual casting to "0x{string}". Use isValidHexString() function instead.',
    },
  },
  create(context) {
    return {
      TSTypeAssertion(node) {
        if (isHexStringTypeAssertion(node)) {
          context.report({ node, messageId: 'noHexStringCasting' })
        }
      },
      TSAsExpression(node) {
        if (isHexStringTypeAssertion(node)) {
          context.report({ node, messageId: 'noHexStringCasting' })
        }
      },
    }
  },
}

// ── no-transform-percentage-strings ────────────────────────────────────

const noTransformPercentageStrings = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      noPercentageTransform:
        'Percentage strings like "{{value}}" are not allowed in {{property}}. ' +
        'Use numeric pixel values instead. ' +
        'Percentage transforms cause React Native crashes on Android.',
    },
  },
  create(context) {
    function isPercentageLiteral(node) {
      return node.type === 'Literal' && typeof node.value === 'string' && /^-?\d+(\.\d+)?%$/.test(node.value)
    }

    function isPercentageTemplateLiteral(node) {
      if (node.type !== 'TemplateLiteral') {
        return false
      }
      const lastQuasi = node.quasis[node.quasis.length - 1]
      return lastQuasi && lastQuasi.value.raw.endsWith('%')
    }

    function isTransformProperty(property) {
      return (
        property.type === 'Property' &&
        property.key.type === 'Identifier' &&
        (property.key.name === 'translateX' || property.key.name === 'translateY')
      )
    }

    function getValueString(node) {
      if (node.type === 'Literal') {
        return String(node.value)
      }
      if (node.type === 'TemplateLiteral') {
        return '<template>%'
      }
      return '<unknown>%'
    }

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
              data: { property: property.key.name, value: getValueString(value) },
            })
          }
        }
      }
    }

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
      Property(node) {
        if (isInJSXContext(node)) {
          return
        }
        if (node.key.type === 'Identifier' && node.key.name === 'transform' && node.value.type === 'ArrayExpression') {
          checkTransformArray(node.value)
        }
        if (node.key.type === 'Identifier' && node.key.name === 'style' && node.value.type === 'ObjectExpression') {
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
      JSXAttribute(node) {
        if (
          node.name.type === 'JSXIdentifier' &&
          node.name.name === 'transform' &&
          node.value?.type === 'JSXExpressionContainer'
        ) {
          checkTransformArray(node.value.expression)
        }
        if (
          node.name.type === 'JSXIdentifier' &&
          node.name.name === 'style' &&
          node.value?.type === 'JSXExpressionContainer'
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

// ── enforce-query-options-result ────────────────────────────────────────

const enforceQueryOptionsResult = {
  meta: {
    type: 'problem',
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          importPath: { type: 'string', default: 'utilities/src/reactQuery/queryOptions' },
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

    let hasQueryOptionsResultImport = false
    let existingImportNode = null
    const processedFunctions = new WeakSet()
    const prohibitedTypes = new Set(['UseQueryOptions', 'UseQueryResult', 'QueryOptions'])

    function checkFunctionReturnType(node) {
      if (processedFunctions.has(node)) {
        return
      }
      processedFunctions.add(node)
      if (!node.returnType?.typeAnnotation) {
        return
      }
      if (isHook(node)) {
        return
      }

      const typeAnnotation = node.returnType.typeAnnotation
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
            if (!hasQueryOptionsResultImport) {
              if (existingImportNode) {
                const lastSpecifier = existingImportNode.specifiers[existingImportNode.specifiers.length - 1]
                fixes.push(fixer.insertTextAfter(lastSpecifier, ', QueryOptionsResult'))
              } else {
                const insertText = `import { QueryOptionsResult } from '${importPath}'\n`
                const firstImport = sourceCode.ast.body.find((n) => n.type === 'ImportDeclaration')
                fixes.push(
                  firstImport
                    ? fixer.insertTextBefore(firstImport, insertText)
                    : fixer.insertTextBeforeRange([0, 0], insertText),
                )
              }
            }
            return fixes
          },
        })
      }
    }

    return {
      ImportDeclaration(node) {
        const importValue = node.source?.value
        if (!importValue) {
          return
        }
        if (
          importValue.includes('reactQuery/queryOptions') ||
          importValue.includes('utilities/src/reactQuery') ||
          importValue.includes('utilities/reactQuery')
        ) {
          existingImportNode = node
          if (
            node.specifiers.some(
              (spec) => spec.type === 'ImportSpecifier' && spec.imported.name === 'QueryOptionsResult',
            )
          ) {
            hasQueryOptionsResultImport = true
          }
        }
      },
      FunctionDeclaration: checkFunctionReturnType,
      FunctionExpression: checkFunctionReturnType,
      ArrowFunctionExpression: checkFunctionReturnType,
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

// ── no-redux-modals ────────────────────────────────────────────────────

const noReduxModals = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      noNewModals:
        'Adding new modal types to modalSlice is deprecated. Please use React Navigation for new modals instead.',
    },
  },
  create(context) {
    if (!context.getFilename().endsWith('modalSlice.ts')) {
      return {}
    }

    const existingModalTypes = new Set([
      'BiometricsModalParams',
      'EditProfileSettingsModalParams',
      'EditLabelSettingsModalParams',
      'ExploreModalParams',
      'FiatCurrencySelectorParams',
      'FiatOnRampAggregatorModalParams',
      'LanguageSelectorModalParams',
      'SettingsAppearanceModalParams',
      'PortfolioBalanceModalParams',
      'ManageWalletsModalParams',
      'WalletConnectModalParams',
      'ConnectionsDappListModalParams',
      'SwapModalParams',
      'SendModalParams',
      'PermissionsModalParams',
      'OpenModalParams',
      'CloseModalParams',
    ])

    return {
      'TSTypeAliasDeclaration, TSInterfaceDeclaration'(node) {
        const typeName = node.id.name
        if (typeName.endsWith('ModalParams') && !existingModalTypes.has(typeName)) {
          context.report({ node: node.id, messageId: 'noNewModals' })
        }
      },
    }
  },
}

// ── no-relative-import-paths ───────────────────────────────────────────
// Ported from eslint-plugin-no-relative-import-paths (original lacks schema)

const noRelativeImportPaths = {
  meta: {
    type: 'layout',
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          allowSameFolder: { type: 'boolean' },
          rootDir: { type: 'string' },
          prefix: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const allowSameFolder = context.options[0]?.allowSameFolder || false
    const rootDir = context.options[0]?.rootDir || ''
    const prefix = context.options[0]?.prefix || ''

    function isParentFolder(relPath) {
      if (!relPath.startsWith('../')) {
        return false
      }
      if (rootDir === '') {
        return true
      }
      const absoluteRootPath = context.getCwd() + sep + rootDir
      const absoluteFilePath = join(dirname(context.getFilename()), relPath)
      return absoluteFilePath.startsWith(absoluteRootPath) && context.getFilename().startsWith(absoluteRootPath)
    }

    function getAbsolutePath(relPath) {
      return [
        prefix,
        ...relative(
          context.getCwd() + (rootDir !== '' ? sep + rootDir : ''),
          join(dirname(context.getFilename()), relPath),
        ).split(sep),
      ]
        .filter(String)
        .join('/')
    }

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value
        if (importPath.startsWith('../') && isParentFolder(importPath)) {
          context.report({
            node,
            message: 'import statements should have an absolute path',
            fix(fixer) {
              return fixer.replaceTextRange(
                [node.source.range[0] + 1, node.source.range[1] - 1],
                getAbsolutePath(importPath),
              )
            },
          })
        }
        if (importPath.startsWith('./') && !allowSameFolder) {
          context.report({
            node,
            message: 'import statements should have an absolute path',
            fix(fixer) {
              return fixer.replaceTextRange(
                [node.source.range[0] + 1, node.source.range[1] - 1],
                getAbsolutePath(importPath),
              )
            },
          })
        }
      },
    }
  },
}

// ── no-nested-component-definitions ──────────────────────────────────
// Ported from @eslint-react/no-nested-component-definitions.
// Detects component definitions nested inside other components.

function isComponentName(name) {
  return typeof name === 'string' && /^[A-Z]/.test(name)
}

function getFunctionName(node) {
  if (node.id?.name) {
    return node.id.name
  }
  const parent = node.parent
  if (parent?.type === 'VariableDeclarator' && parent.id?.type === 'Identifier') {
    return parent.id.name
  }
  return null
}

function returnsJSX(node) {
  const body = node.body
  if (!body) {
    return false
  }
  if (body.type === 'JSXElement' || body.type === 'JSXFragment') {
    return true
  }
  if (body.type === 'BlockStatement') {
    return containsJSXReturn(body)
  }
  return false
}

function containsJSXReturn(block) {
  for (const stmt of block.body) {
    if (stmt.type === 'ReturnStatement' && stmt.argument) {
      const arg = stmt.argument
      if (arg.type === 'JSXElement' || arg.type === 'JSXFragment') {
        return true
      }
      if (arg.type === 'ConditionalExpression') {
        if (arg.consequent.type === 'JSXElement' || arg.alternate.type === 'JSXElement') {
          return true
        }
      }
      if (arg.type === 'LogicalExpression') {
        if (arg.right.type === 'JSXElement') {
          return true
        }
      }
    }
    if (stmt.type === 'IfStatement') {
      if (stmt.consequent.type === 'BlockStatement' && containsJSXReturn(stmt.consequent)) {
        return true
      }
      if (stmt.alternate?.type === 'BlockStatement' && containsJSXReturn(stmt.alternate)) {
        return true
      }
    }
  }
  return false
}

function isRenderPropValue(node) {
  if (node.parent?.type === 'JSXExpressionContainer' && node.parent.parent?.type === 'JSXAttribute') {
    return true
  }
  if (
    node.parent?.type === 'Property' &&
    node.parent.parent?.type === 'ObjectExpression' &&
    node.parent.parent.parent?.type === 'CallExpression'
  ) {
    const callee = node.parent.parent.parent.callee
    if (callee?.property?.name === 'createElement') {
      return true
    }
  }
  return false
}

function findParentComponent(node) {
  let current = node.parent
  while (current) {
    if (
      (current.type === 'FunctionDeclaration' ||
        current.type === 'FunctionExpression' ||
        current.type === 'ArrowFunctionExpression') &&
      isComponentName(getFunctionName(current))
    ) {
      return current
    }
    current = current.parent
  }
  return null
}

const noNestedComponentDefinitions = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      nested:
        'Do not define component "{{name}}" inside another component. Move it to module scope or pass it as a prop.',
    },
  },
  create(context) {
    function check(node) {
      const name = getFunctionName(node)
      // Only flag named functions with uppercase component names.
      // Anonymous arrows in .map(), useCallback, useMemo etc. are
      // render callbacks, not component definitions.
      if (!name || !isComponentName(name)) {
        return
      }
      if (!returnsJSX(node)) {
        return
      }

      const parentComponent = findParentComponent(node)
      if (!parentComponent) {
        return
      }

      context.report({ node: node.id || node, messageId: 'nested', data: { name } })
    }

    return {
      FunctionDeclaration: check,
      FunctionExpression: check,
      ArrowFunctionExpression: check,
    }
  },
}

// ── jsx-prop-order ──────────────────────────────────────────────────────
// Ported from perfectionist/sort-jsx-props with type:'unsorted'.
// Only enforces group ordering (reserved → shorthand → unknown → callback),
// NOT alphabetical sorting within groups.

const jsxPropOrder = {
  meta: {
    type: 'layout',
    schema: [
      {
        type: 'object',
        properties: {
          groups: { type: 'array', items: { type: 'string' } },
          reservedPattern: { type: 'string' },
          callbackPattern: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      wrongOrder:
        '{{name}} ({{group}}) should come before {{beforeName}} ({{beforeGroup}}). Expected order: {{order}}.',
    },
  },
  create(context) {
    const options = context.options[0] || {}
    const groups = options.groups || ['reserved', 'shorthand-prop', 'unknown', 'callback']
    const reservedRe = new RegExp(options.reservedPattern || '^(key|ref)$')
    const callbackRe = new RegExp(options.callbackPattern || '^on[A-Z].+')

    function getGroup(attr) {
      if (attr.type === 'JSXSpreadAttribute') {
        return null
      } // skip spreads — can't know their group
      const name =
        attr.name?.type === 'JSXNamespacedName' ? `${attr.name.namespace.name}:${attr.name.name.name}` : attr.name?.name
      if (!name) {
        return 'unknown'
      }
      if (reservedRe.test(name)) {
        return 'reserved'
      }
      if (callbackRe.test(name)) {
        return 'callback'
      }
      if (attr.value === null) {
        return 'shorthand-prop'
      }
      return 'unknown'
    }

    function getAttrName(attr) {
      if (attr.type === 'JSXSpreadAttribute') {
        return '{...spread}'
      }
      if (attr.name?.type === 'JSXNamespacedName') {
        return `${attr.name.namespace.name}:${attr.name.name.name}`
      }
      return attr.name?.name || '<unknown>'
    }

    return {
      JSXOpeningElement(node) {
        const attrs = node.attributes
        if (attrs.length < 2) {
          return
        }

        let maxGroupIndex = -1
        let maxGroupName = ''
        let maxGroupAttrName = ''

        for (const attr of attrs) {
          const group = getGroup(attr)
          const groupIndex = groups.indexOf(group)
          if (groupIndex === -1) {
            continue
          }

          if (groupIndex < maxGroupIndex) {
            context.report({
              node: attr,
              messageId: 'wrongOrder',
              data: {
                name: getAttrName(attr),
                group,
                beforeName: maxGroupAttrName,
                beforeGroup: maxGroupName,
                order: groups.join(' → '),
              },
            })
            return
          }

          if (groupIndex > maxGroupIndex) {
            maxGroupIndex = groupIndex
            maxGroupName = group
            maxGroupAttrName = getAttrName(attr)
          }
        }
      },
    }
  },
}

// ── enum-member-naming ─────────────────────────────────────────────────
// Ported from @typescript-eslint/naming-convention (enumMember + PascalCase only).
// Can be replaced when oxlint-tsgolint supports the naming-convention rule

const PASCAL_CASE_RE = /^[A-Z][a-zA-Z0-9]*$/

const enumMemberNaming = {
  meta: {
    type: 'suggestion',
    schema: [],
    messages: {
      notPascalCase: 'Enum member "{{name}}" must be PascalCase.',
    },
  },
  create(context) {
    return {
      TSEnumMember(node) {
        const name =
          node.id.type === 'Identifier' ? node.id.name : node.id.type === 'Literal' ? String(node.id.value) : null
        if (name && !PASCAL_CASE_RE.test(name)) {
          context.report({ node: node.id, messageId: 'notPascalCase', data: { name } })
        }
      },
    }
  },
}

// ── no-tolowercase-address-currencyid ──────────────────────────────────

const ADDRESS_NAME_RE =
  /address|addr|token|contract|pool|currency|wallet|signer|account|recipient|sender|swapper|owner|hash|order|tx|transaction|txn/i
const CURRENCY_NAME_RE = /currencyid|tokenid/i

function getVariableName(node) {
  if (node.type === 'Identifier') {
    return node.name
  }
  if (node.type === 'MemberExpression' && node.property) {
    if (node.property.type === 'Identifier') {
      return node.property.name
    }
    if (node.property.type === 'Literal') {
      return String(node.property.value)
    }
  }
  return null
}

const noToLowerCaseAddressCurrencyId = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow using .toLowerCase() on addresses or currencyIds, since Solana addresses are case-sensitive',
    },
    schema: [],
    messages: {
      noToLowerCaseAddress:
        'Do not use .toLowerCase() on addresses. Use areAddressesEqual() or normalizeTokenAddressForCache() from packages/uniswap instead.',
      noToLowerCaseCurrencyId:
        'Do not use .toLowerCase() on currencyIds. Use areCurrencyIdsEqual() or normalizeCurrencyIdForMapLookup() from packages/uniswap instead.',
    },
  },
  create(context) {
    return {
      'CallExpression[callee.property.name="toLowerCase"][arguments.length=0]'(node) {
        const objectNode = node.callee.object
        const variableName = getVariableName(objectNode)
        if (!variableName) {
          return
        }

        if (CURRENCY_NAME_RE.test(variableName)) {
          context.report({ node, messageId: 'noToLowerCaseCurrencyId' })
        } else if (ADDRESS_NAME_RE.test(variableName)) {
          context.report({ node, messageId: 'noToLowerCaseAddress' })
        }
      },
    }
  },
}

// ── no-platform-gate-in-chain-flags ──────────────────────────────────
// Platform restrictions belong in chain metadata (supportedApps), not feature flags.

const CHAIN_FLAGS_FILE = 'useFeatureFlaggedChainIds.ts'
const PLATFORM_GATE_IMPORTS = new Set(['isWebApp', 'isMobileApp', 'isExtensionApp'])

const noPlatformGateInChainFlags = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow platform booleans in useFeatureFlaggedChainIds — gate chains by app using supportedApps on chain info.',
    },
    schema: [],
    messages: {
      noPlatformGate:
        'Do not use {{name}} as a chain gate in useFeatureFlaggedChainIds. Set supportedApps on the chain info instead.',
    },
  },
  create(context) {
    const filename = (context.filename ?? context.getFilename?.() ?? '').split(/[/\\]/).join('/')
    if (!filename.endsWith(CHAIN_FLAGS_FILE)) {
      return {}
    }

    return {
      ImportDeclaration(node) {
        if (node.source?.value !== '@universe/environment') {
          return
        }
        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportSpecifier' || specifier.imported.type !== 'Identifier') {
            continue
          }
          const name = specifier.imported.name
          if (PLATFORM_GATE_IMPORTS.has(name)) {
            context.report({ node: specifier, messageId: 'noPlatformGate', data: { name } })
          }
        }
      },
    }
  },
}

// ── import-boundary (JSON) ─────────────────────────────────────────────
// Modes:
//   importerAllowlist — only paths matching allowedImporterPathMarkers may import
//     modules matching importPrefixes; imports from within importerInternalPathMarkers are always allowed.
//   importerDenylist — if a module matches importPrefixes and the importer path matches
//     deniedImporterPathMarkers, the import is forbidden (no allowlist).

const __importBoundaryDir = dirname(fileURLToPath(import.meta.url))

function getPhysicalFilenameForBoundary(context) {
  const fn = context.filename ?? context.getFilename?.()
  if (typeof fn !== 'string' || fn === '<input>' || fn === '<text>') {
    return ''
  }
  return fn.split('\\').join('/')
}

function physicalPathHasMarker(physicalPath, markers) {
  return markers.some((m) => physicalPath.includes(m))
}

function moduleImportSuffixForBoundary(source, boundary) {
  if (typeof source !== 'string') {
    return null
  }
  for (const prefix of boundary.importPrefixes) {
    if (source.startsWith(prefix)) {
      return source.slice(prefix.length)
    }
  }
  if (boundary.bareModuleSources.includes(source)) {
    return ''
  }
  return null
}

function loadImportBoundaries() {
  const configPath = join(__importBoundaryDir, 'import-boundaries.json')
  const raw = readFileSync(configPath, 'utf8')
  const { boundaries } = JSON.parse(raw)
  if (!Array.isArray(boundaries) || boundaries.length === 0) {
    throw new Error(`import-boundaries.json must define a non-empty "boundaries" array (${configPath})`)
  }
  return boundaries.map((b, i) => {
    const id = b.id ?? `boundary[${i}]`
    const mode = b.mode ?? 'importerAllowlist'
    if (mode !== 'importerAllowlist' && mode !== 'importerDenylist') {
      throw new Error(
        `import-boundaries.json: boundary "${id}" has unknown "mode" "${mode}" (use "importerAllowlist" or "importerDenylist")`,
      )
    }
    if (typeof b.message !== 'string' || !b.message.trim()) {
      throw new Error(`import-boundaries.json: boundary "${id}" needs a non-empty "message" string`)
    }
    if (!Array.isArray(b.importPrefixes) || b.importPrefixes.length === 0) {
      throw new Error(`import-boundaries.json: boundary "${id}" needs a non-empty "importPrefixes"`)
    }
    if (!Array.isArray(b.bareModuleSources)) {
      throw new Error(`import-boundaries.json: boundary "${id}" must set "bareModuleSources" (array, may be empty)`)
    }

    if (mode === 'importerDenylist') {
      if (!Array.isArray(b.deniedImporterPathMarkers) || b.deniedImporterPathMarkers.length === 0) {
        throw new Error(
          `import-boundaries.json: boundary "${id}" (importerDenylist) needs non-empty "deniedImporterPathMarkers"`,
        )
      }
      return {
        id,
        mode,
        message: b.message,
        deniedImporterPathMarkers: b.deniedImporterPathMarkers,
        importPrefixes: b.importPrefixes,
        bareModuleSources: b.bareModuleSources,
      }
    }

    for (const key of ['importerInternalPathMarkers', 'allowedImporterPathMarkers']) {
      if (b[key] == null || (Array.isArray(b[key]) && b[key].length === 0)) {
        throw new Error(`import-boundaries.json: boundary "${id}" needs a non-empty "${key}"`)
      }
    }
    return {
      id,
      mode,
      message: b.message,
      importerInternalPathMarkers: b.importerInternalPathMarkers,
      allowedImporterPathMarkers: b.allowedImporterPathMarkers,
      importPrefixes: b.importPrefixes,
      bareModuleSources: b.bareModuleSources,
    }
  })
}

const importBoundaryBoundaries = loadImportBoundaries()

const importBoundary = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce import boundaries from config/oxlint-plugins/import-boundaries.json.',
    },
    schema: [],
    messages: {},
  },
  create(context) {
    const physicalPath = getPhysicalFilenameForBoundary(context)

    function reportIfDisallowedImport(node, sourceValue) {
      if (sourceValue === undefined || sourceValue === null) {
        return
      }
      for (const boundary of importBoundaryBoundaries) {
        const suffix = moduleImportSuffixForBoundary(sourceValue, boundary)
        if (suffix === null) {
          continue
        }
        if (boundary.mode === 'importerDenylist') {
          if (physicalPathHasMarker(physicalPath, boundary.deniedImporterPathMarkers)) {
            context.report({ node, message: boundary.message })
          }
          continue
        }
        // importerAllowlist: imports of this feature are only allowed from internal + allowlisted paths.
        if (physicalPathHasMarker(physicalPath, boundary.importerInternalPathMarkers)) {
          continue
        }
        if (physicalPathHasMarker(physicalPath, boundary.allowedImporterPathMarkers)) {
          return
        }
        context.report({ node, message: boundary.message })
        return
      }
    }

    return {
      ImportDeclaration(node) {
        reportIfDisallowedImport(node, node.source?.value)
      },
      ImportExpression(node) {
        if (node.source?.type !== 'Literal' || typeof node.source.value !== 'string') {
          return
        }
        reportIfDisallowedImport(node.source, node.source.value)
      },
    }
  },
}

// ── no-direct-viem-ethers-import ───────────────────────────────────────
// Routes viem/ethers/@ethersproject consumers through `@universe/chains`.
// Allowlist below names every file that imports these directly today.
// It's ok to update the allowlist if you're unable to use chains.

const DIRECT_VIEM_ETHERS_IMPORT_ALLOWLIST = new Set([
  'apps/web/src/components/AccountDrawer/MiniPortfolio/Activity/cancel/cancel.ts',
  'apps/web/src/connection/bundlerClient.ts',
  'apps/web/src/connection/EmbeddedWalletConnector.ts',
  'apps/web/src/connection/EmbeddedWalletProvider.ts',
  'apps/web/src/connection/sendCalls.ts',
  'apps/web/src/connection/userOpSigning.ts',
  'apps/web/src/connection/rejectableConnector.ts',
  'apps/web/src/connection/wagmiConfig.ts',
  'apps/web/src/constants/providers.ts',
  'apps/web/src/features/accounts/store/updater.tsx',
  'apps/web/src/features/Swap/hooks/useSendCallback.ts',
  'apps/web/src/pages/Swap/Send/state/hooks.tsx',
  'apps/web/src/features/Toucan/Auction/BidForm/BidReviewModal/useBidPermit2Flow.ts',
  'apps/web/src/hooks/useContract.ts',
  'apps/web/src/hooks/useEthersProvider.ts',
  'apps/web/src/hooks/useEthersSigner.ts',
  'apps/web/src/hooks/useSelectChain.ts',
  'apps/web/src/hooks/useTransactionGasFee.ts',
  'apps/web/src/hooks/useUniswapXSwapCallback.ts',
  'apps/web/src/lib/utils/resolveENSContentHash.ts',
  'apps/web/src/pages/PoolDetails/Pools/hooks/useContractMultichain.tsx',
  'apps/web/src/pages/PoolDetails/Pools/hooks/useMultiChainPositions.tsx',
  'apps/web/src/playwright/anvil/anvil-manager.ts',
  'apps/web/src/playwright/anvil/utils.ts',
  'apps/web/src/playwright/fixtures/anvil.ts',
  'apps/web/src/rpc/AppJsonRpcProvider.ts',
  'apps/web/src/rpc/ConfiguredJsonRpcProvider.ts',
  'apps/web/src/state/activity/polling/batch.ts',
  'apps/web/src/features/claim/hooks.ts',
  'apps/web/src/state/logs/slice.ts',
  'apps/web/src/state/logs/updater.ts',
  'apps/web/src/state/logs/utils.ts',
  'apps/web/src/state/routing/types.ts',
  'apps/web/src/state/routing/utils.ts',
  'apps/web/src/state/sagas/transactions/5792.ts',
  'apps/web/src/state/sagas/transactions/cancelOrderSaga.ts',
  'apps/web/src/state/sagas/transactions/cancelPlanStepSaga.ts',
  'apps/web/src/state/sagas/transactions/utils.ts',
  'apps/web/src/state/transactions/hooks.tsx',
  'apps/web/src/state/transactions/types.ts',
  'apps/web/src/utils/transfer.ts',
  'apps/web/src/utils/walletMeta.ts',
])

/**
 * Checks if an import is directly viem/ethers.
 * Matching what we consider to be a banned source.
 */
function isDirectViemEthersSource(source) {
  if (typeof source !== 'string') {
    return false
  }
  return (
    source === 'viem' ||
    source.startsWith('viem/') ||
    source === 'ethers' ||
    source.startsWith('ethers/') ||
    source.startsWith('@ethersproject/')
  )
}

/**
 * Checks if a path is in the direct viem/ethers allow
 * list. We only allow what's currently existing.
 */
function isDirectViemEthersAllowlisted(physicalPath) {
  for (const allowed of DIRECT_VIEM_ETHERS_IMPORT_ALLOWLIST) {
    if (physicalPath === allowed || physicalPath.endsWith('/' + allowed)) {
      return true
    }
  }
  return false
}

// TODO: Replace this custom rule with `no-restricted-imports`
// when most of the remaining exceptions have been migrated.
// We can use that rule w/ single-line disabling comments.
const noDirectViemEthersImport = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow direct viem/ethers imports; route through @universe/chains.' },
    schema: [],
    messages: {},
  },
  create(context) {
    const fn = context.filename ?? context.getFilename?.()
    if (typeof fn !== 'string' || fn === '<input>' || fn === '<text>') {
      return {}
    }
    const physicalPath = fn.split('\\').join('/')
    if (isDirectViemEthersAllowlisted(physicalPath)) {
      return {}
    }
    function reportIfDirect(node, source) {
      if (isDirectViemEthersSource(source)) {
        context.report({
          node,
          message: [
            'Import from `@universe/chains` instead, not viem/ethers directly.',
            "If what you need isn't there, update the allowlist in `universe-custom.js`.",
            'Entries in `DIRECT_VIEM_ETHERS_IMPORT_ALLOWLIST` are exempt.',
          ].join(' '),
        })
      }
    }
    return {
      ImportDeclaration(node) {
        reportIfDirect(node, node.source?.value)
      },
      ImportExpression(node) {
        if (node.source?.type !== 'Literal' || typeof node.source.value !== 'string') {
          return
        }
        reportIfDirect(node.source, node.source.value)
      },
    }
  },
}

// ── Plugin export ──────────────────────────────────────────────────────

const plugin = {
  meta: { name: 'universe-custom' },
  rules: {
    'no-unwrapped-t': noUnwrappedT,
    'custom-map-sort': customMapSort,
    'no-hex-string-casting': noHexStringCasting,
    'no-transform-percentage-strings': noTransformPercentageStrings,
    'enforce-query-options-result': enforceQueryOptionsResult,
    'no-redux-modals': noReduxModals,
    'no-relative-import-paths': noRelativeImportPaths,
    'import-boundary': importBoundary,
    'no-direct-viem-ethers-import': noDirectViemEthersImport,
    'no-nested-component-definitions': noNestedComponentDefinitions,
    'jsx-prop-order': jsxPropOrder,
    'enum-member-naming': enumMemberNaming,
    'no-tolowercase-address-currencyid': noToLowerCaseAddressCurrencyId,
    'no-platform-gate-in-chain-flags': noPlatformGateInChainFlags,
  },
}

export default plugin
