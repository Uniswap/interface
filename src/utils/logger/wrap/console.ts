/***
 * Marks (and potentially logs) uses of console (by monkey-patching JsonRpcProvider).
 */

import { mark } from '..'

const consoleDebug = console.debug
console.debug = function LoggingAwareDebug(message, ...params: any[]) {
  mark('console.debug', { message, params })
  return consoleDebug(message, ...params)
}

const consoleLog = console.log
console.log = function LoggingAwareLog(message, ...params: any[]) {
  mark('console.log', { message, params })
  return consoleLog(message, ...params)
}

const consoleWarn = console.warn
console.warn = function LoggingAwareWarn(message, ...params: any[]) {
  mark('console.warn', { message, params })
  return consoleWarn(message, ...params)
}

const consoleError = console.error
console.error = function LoggingAwareError(error, ...params: any[]) {
  const message = error instanceof Error ? error.message : error.toString()
  mark('console.error', { message, params }, message)
  return consoleError(error, ...params)
}
