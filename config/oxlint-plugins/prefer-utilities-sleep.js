/**
 * universe-custom/prefer-utilities-sleep — registered by universe-custom.js, with
 * colocated tests in prefer-utilities-sleep.test.ts driving the real oxlint binary.
 */

// Flags a hand-rolled delay, `new Promise((resolve) => setTimeout(resolve, ms))`,
// and points at the shared `sleep` from utilities/src/time/timing.
//
// Only an executor whose entire body is the one setTimeout call counts, and the
// timer must resolve with no value. Resolving `true` or `'done'` after a delay is a
// delayed value, which callers read. Anything else in the executor
// (a stored timer id, a reject branch, resolving with a computed value) is a
// timeout or race helper, not a sleep.

// `sleep` itself is the pattern, by definition.
const SLEEP_MODULE_SUFFIX = 'utilities/src/time/timing.ts'

const TIMER_OBJECTS = new Set(['window', 'globalThis', 'global'])

function isSetTimeoutCall(node) {
  if (node?.type !== 'CallExpression' || node.arguments.length !== 2) {
    return false
  }
  const { callee } = node
  if (callee.type === 'Identifier') {
    return callee.name === 'setTimeout'
  }
  return (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.object.type === 'Identifier' &&
    TIMER_OBJECTS.has(callee.object.name) &&
    callee.property.type === 'Identifier' &&
    callee.property.name === 'setTimeout'
  )
}

function isFunction(node) {
  return node?.type === 'ArrowFunctionExpression' || node?.type === 'FunctionExpression'
}

/** The lone expression a function body evaluates: a concise body, or a block of one expression/return statement. */
function soleExpression(body) {
  if (body.type !== 'BlockStatement') {
    return body
  }
  if (body.body.length !== 1) {
    return undefined
  }
  const [statement] = body.body
  if (statement.type === 'ExpressionStatement') {
    return statement.expression
  }
  if (statement.type === 'ReturnStatement') {
    return statement.argument ?? undefined
  }
  return undefined
}

/** `resolve`, or a zero-param callback whose sole expression is `resolve()` / `resolve(undefined)`. */
function resolvesWithoutValue(timerCallback, resolveName) {
  if (timerCallback.type === 'Identifier') {
    return timerCallback.name === resolveName
  }
  if (!isFunction(timerCallback) || timerCallback.params.length !== 0) {
    return false
  }
  const call = soleExpression(timerCallback.body)
  return (
    call?.type === 'CallExpression' &&
    call.callee.type === 'Identifier' &&
    call.callee.name === resolveName &&
    call.arguments.length <= 1 &&
    call.arguments.every((arg) => arg.type === 'Identifier' && arg.name === 'undefined')
  )
}

const preferUtilitiesSleep = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow hand-rolling a delay with new Promise + setTimeout; use the shared sleep()',
    },
    schema: [],
    messages: {
      preferUtilitiesSleep:
        'Do not hand-roll a delay. Use sleep(ms) from utilities/src/time/timing instead of new Promise + setTimeout.',
    },
  },
  create(context) {
    const filename = (context.filename ?? context.getFilename?.() ?? '').split(/[/\\]/).join('/')
    if (filename.endsWith(SLEEP_MODULE_SUFFIX)) {
      return {}
    }

    return {
      NewExpression(node) {
        if (node.callee.type !== 'Identifier' || node.callee.name !== 'Promise' || node.arguments.length !== 1) {
          return
        }
        const [executor] = node.arguments
        if (!isFunction(executor) || executor.params[0]?.type !== 'Identifier') {
          return
        }
        const timerCall = soleExpression(executor.body)
        if (isSetTimeoutCall(timerCall) && resolvesWithoutValue(timerCall.arguments[0], executor.params[0].name)) {
          context.report({ node, messageId: 'preferUtilitiesSleep' })
        }
      },
    }
  },
}

export default preferUtilitiesSleep
