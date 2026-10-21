/**
 * universe-custom/no-wallet-secrets-in-state — in its own module alongside the other
 * cross-node rules; registered by universe-custom.js, with colocated tests in
 * no-wallet-secrets-in-state.test.ts driving the real oxlint binary over fixtures.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Flags a wallet secret (password in any spelling, PIN, mnemonic, private key) heading into a
// persisted sink: react-query mutation variables, a react-query query key, or a redux action
// payload. Those stores keep the value after the code that needed it is done (a settled mutation
// keeps `state.variables` until gc, five minutes by default), where anything holding the store
// can read it. The runtime tripwire in utilities/src/security catches the same thing in dev and
// test; this rule catches it at review time, by name, with no type information:
//   - `useMutation<…, …, { password }>()`, `UseMutationResult<…, …, { password }>`,
//     `UseMutationOptions<…, …, { password }>`
//   - a `mutationFn` whose first parameter is named or destructures a secret, whether inline,
//     wrapped in useEvent/useCallback, or declared as a const elsewhere in the same file
//   - `mutate({ password })`, `mutateAsync(password)`
//   - `PayloadAction<{ mnemonic }>`, `createAction<{ mnemonic }>()`
//   - `queryKey: […, password]`, `queryKey: […, { seedPhrase }]`
// It cannot see a `mutationFn` imported from another file; the runtime tripwire covers that.
// The sanctioned shape is `useSecretMutation` (utilities/src/security/useSecretMutation).

// The key list is shared with WALLET_SECRET_REDACT_PATHS in @universe/privacy (the runtime scrubber
// and tripwire) through one JSON file, since this plugin is plain JS and cannot import that package's TS.
const WALLET_SECRET_KEYS_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'packages/privacy/src/wallet-secret-keys.json',
)
export const WALLET_SECRET_KEYS = new Set(JSON.parse(readFileSync(WALLET_SECRET_KEYS_PATH, 'utf8')))

const MUTATION_VARIABLES_TYPES = new Set(['UseMutationResult', 'UseMutationOptions'])
const MUTATE_CALLEES = new Set(['mutate', 'mutateAsync'])
const CALLBACK_WRAPPERS = new Set(['useEvent', 'useCallback'])
const TEST_FILE_RX = /\.test\.[jt]sx?$/

const SINK = {
  mutationVariables: 'react-query mutation variables',
  queryKey: 'a react-query query key',
  reduxPayload: 'a redux action payload',
}

function calleeName(node) {
  const { callee } = node
  if (callee.type === 'Identifier') {
    return callee.name
  }
  if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
    return callee.property.name
  }
  return undefined
}

function typeArgs(node) {
  return node.typeArguments?.params ?? node.typeParameters?.params ?? []
}

function keyName(key) {
  if (!key) {
    return undefined
  }
  if (key.type === 'Identifier') {
    return key.name
  }
  if (key.type === 'Literal' && typeof key.value === 'string') {
    return key.value
  }
  return undefined
}

/** First wallet-secret member of a `{ … }` type literal. */
function secretInTypeLiteral(typeNode) {
  if (typeNode?.type !== 'TSTypeLiteral') {
    return undefined
  }
  for (const member of typeNode.members) {
    const name = member.type === 'TSPropertySignature' ? keyName(member.key) : undefined
    if (name && WALLET_SECRET_KEYS.has(name)) {
      return { name, node: member }
    }
  }
  return undefined
}

/** First wallet-secret property of an object literal (spreads are opaque and skipped). */
function secretInObjectExpression(node) {
  if (node?.type !== 'ObjectExpression') {
    return undefined
  }
  for (const property of node.properties) {
    const name = property.type === 'Property' ? keyName(property.key) : undefined
    if (name && WALLET_SECRET_KEYS.has(name)) {
      return { name, node: property }
    }
  }
  return undefined
}

/** A bare identifier named like a secret, e.g. `mutate(password)` or `queryKey: [x, password]`. */
function secretIdentifier(node) {
  return node?.type === 'Identifier' && WALLET_SECRET_KEYS.has(node.name) ? { name: node.name, node } : undefined
}

/** A function's first parameter named or destructuring a secret: `(password: string)`, `({ password })`. */
function secretInFirstParam(fn) {
  let param = fn.params[0]
  if (param?.type === 'AssignmentPattern') {
    param = param.left
  }
  if (!param) {
    return undefined
  }
  if (param.type === 'Identifier') {
    return secretIdentifier(param)
  }
  if (param.type === 'ObjectPattern') {
    for (const property of param.properties) {
      const name = property.type === 'Property' ? keyName(property.key) : undefined
      if (name && WALLET_SECRET_KEYS.has(name)) {
        return { name, node: property }
      }
    }
  }
  return undefined
}

/** `PayloadAction` from both `PayloadAction<…>` and a namespace import's `RTK.PayloadAction<…>`. */
function referencedTypeName(typeName) {
  if (typeName.type === 'Identifier') {
    return typeName.name
  }
  if (typeName.type === 'TSQualifiedName' && typeName.right.type === 'Identifier') {
    return typeName.right.name
  }
  return undefined
}

function isFunctionNode(node) {
  return (
    node?.type === 'ArrowFunctionExpression' ||
    node?.type === 'FunctionExpression' ||
    node?.type === 'FunctionDeclaration'
  )
}

const noWalletSecretsInState = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow wallet secrets (password, PIN, mnemonic, private key) in react-query mutation variables, query keys, or redux action payloads',
    },
    schema: [],
    messages: {
      secretInSink:
        "Wallet secret '{{name}}' would be stored in {{sink}}, which keeps it after use. Wallet secrets live only in the Keyring: pass it through useSecretMutation (utilities/src/security/useSecretMutation) or read it from a closure so it never enters app state.",
    },
  },
  create(context) {
    const filename = (context.filename ?? context.getFilename?.() ?? '').split(/[/\\]/).join('/')
    if (TEST_FILE_RX.test(filename)) {
      return {}
    }

    function report(found, sink) {
      context.report({ node: found.node, messageId: 'secretInSink', data: { name: found.name, sink } })
    }

    /** What an identifier is bound to in this file: a `const`'s initializer or a function declaration. */
    function resolveDeclaration(identifier) {
      for (let scope = context.sourceCode.getScope(identifier); scope; scope = scope.upper) {
        const variable = scope.set.get(identifier.name)
        if (!variable) {
          continue
        }
        const [def] = variable.defs
        if (def?.type === 'Variable') {
          return def.node.init
        }
        return def?.type === 'FunctionName' ? def.node : undefined
      }
      return undefined
    }

    /** Follow `fn`, `useEvent(fn)`, `useCallback(fn, deps)` down to a function node, if it is in this file. */
    function resolveFunction(node, seen = new Set()) {
      if (isFunctionNode(node)) {
        return node
      }
      if (node?.type === 'CallExpression' && CALLBACK_WRAPPERS.has(calleeName(node))) {
        return resolveFunction(node.arguments[0], seen)
      }
      if (node?.type === 'Identifier' && !seen.has(node)) {
        seen.add(node)
        return resolveFunction(resolveDeclaration(node), seen)
      }
      return undefined
    }

    function checkMutationFn(valueNode) {
      const fn = resolveFunction(valueNode)
      if (!fn) {
        return
      }
      const found = secretInFirstParam(fn)
      if (found) {
        report(found, SINK.mutationVariables)
      }
    }

    return {
      CallExpression(node) {
        const name = calleeName(node)

        if (name === 'useMutation') {
          const found = secretInTypeLiteral(typeArgs(node)[2])
          if (found) {
            report(found, SINK.mutationVariables)
          }
          const options = node.arguments[0]
          if (options?.type === 'ObjectExpression') {
            const mutationFn = options.properties.find(
              (property) => property.type === 'Property' && keyName(property.key) === 'mutationFn',
            )
            if (mutationFn) {
              checkMutationFn(mutationFn.value)
            }
          }
          return
        }

        if (name === 'createAction') {
          const found = secretInTypeLiteral(typeArgs(node)[0])
          if (found) {
            report(found, SINK.reduxPayload)
          }
          return
        }

        if (MUTATE_CALLEES.has(name)) {
          const found = secretInObjectExpression(node.arguments[0]) ?? secretIdentifier(node.arguments[0])
          if (found) {
            report(found, SINK.mutationVariables)
          }
        }
      },

      TSTypeReference(node) {
        const typeName = referencedTypeName(node.typeName)
        if (MUTATION_VARIABLES_TYPES.has(typeName)) {
          const found = secretInTypeLiteral(typeArgs(node)[2])
          if (found) {
            report(found, SINK.mutationVariables)
          }
        } else if (typeName === 'PayloadAction') {
          const found = secretInTypeLiteral(typeArgs(node)[0])
          if (found) {
            report(found, SINK.reduxPayload)
          }
        }
      },

      Property(node) {
        if (keyName(node.key) !== 'queryKey' || node.value.type !== 'ArrayExpression') {
          return
        }
        for (const element of node.value.elements) {
          const found = secretIdentifier(element) ?? secretInObjectExpression(element)
          if (found) {
            report(found, SINK.queryKey)
          }
        }
      },
    }
  },
}

export default noWalletSecretsInState
