/**
 * universe-custom/no-swallowed-upstream-error
 *
 * In a backend client or service, a `catch` that returns a value turns an
 * outage into an empty panel, and a message regex turns absence detection
 * into a guess the backend can reword. A catch may return only under an
 * `isRpcNotFound(...)` check; everything else rethrows. Registered by
 * universe-custom.js; tests in no-swallowed-upstream-error.test.ts drive the
 * real oxlint binary over fixtures.
 */

const ABSENCE_CHECK = 'isRpcNotFound'
const FUNCTION_TYPES = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'])

function isTestFile(filename) {
  return /(^|\/)__tests__\/|\.test\.[cm]?[jt]sx?$/.test(filename)
}

/** Only a try that awaits is wrapping an upstream call; a bare JSON.parse / new URL guard is not. */
function tryAwaits(sourceCode, catchClause) {
  return /\bawait\b/.test(sourceCode.getText(catchClause.parent.block))
}

/** The CatchClause this node sits in, and the IfStatements between, unless a function boundary comes first. */
function enclosingCatch(node) {
  const guards = []
  for (let current = node.parent; current; current = current.parent) {
    if (FUNCTION_TYPES.has(current.type)) {
      return undefined
    }
    if (current.type === 'CatchClause') {
      return { clause: current, guards }
    }
    if (current.type === 'IfStatement') {
      guards.push(current)
    }
  }
  return undefined
}

function containsAbsenceCheck(sourceCode, ifStatement) {
  return sourceCode.getText(ifStatement.test).includes(`${ABSENCE_CHECK}(`)
}

function isRegexLiteral(node) {
  return node?.type === 'Literal' && node.regex !== undefined
}

const noSwallowedUpstreamError = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow folding an upstream failure into a returned value, or deciding absence from an error message, in a backend client or service.',
    },
    schema: [],
    messages: {
      swallowedCatch:
        'A catch here may only return under `if ({{check}}(err))`; anything else must rethrow so the failure reaches the tRPC log and the UI instead of rendering as an empty result.',
      proseMatch:
        'Do not classify an upstream error from its message. Use `{{check}}(err)` (status + Connect code) from @universe/api; the backend is free to reword prose.',
    },
  },
  create(context) {
    const { sourceCode } = context
    const filename = context.filename ?? context.getFilename?.() ?? ''
    if (isTestFile(filename.split('\\').join('/'))) {
      return {}
    }
    return {
      ReturnStatement(node) {
        if (!node.argument) {
          return
        }
        const found = enclosingCatch(node)
        if (!found || !tryAwaits(sourceCode, found.clause)) {
          return
        }
        if (found.guards.some((guard) => containsAbsenceCheck(sourceCode, guard))) {
          return
        }
        context.report({ node, messageId: 'swallowedCatch', data: { check: ABSENCE_CHECK } })
      },
      CallExpression(node) {
        if (!enclosingCatch(node)) {
          return
        }
        const { callee } = node
        if (callee.type !== 'MemberExpression' || callee.property.type !== 'Identifier') {
          return
        }
        const method = callee.property.name
        const isRegexTest = method === 'test' && isRegexLiteral(callee.object)
        const isRegexMatch = (method === 'match' || method === 'search') && isRegexLiteral(node.arguments[0])
        if (isRegexTest || isRegexMatch) {
          context.report({ node, messageId: 'proseMatch', data: { check: ABSENCE_CHECK } })
        }
      },
    }
  },
}

export default noSwallowedUpstreamError
