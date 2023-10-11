/* eslint-disable no-console */
import { ScopeContext } from '@sentry/types'
import { errorToString } from 'utilities/src/errors'
import { Sentry } from './Sentry'

const SENTRY_CHAR_LIMIT = 8192

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LoggerErrorContext = Omit<Partial<ScopeContext>, 'tags'> & {
  tags: { file: string; function: string }
}

/**
 * Logs a message to console. Additionally sends log to Sentry if using 'error', 'warn', or 'info'.
 * Use `logger.debug` for development only logs.
 *
 * ex. `logger.warn('myFile', 'myFunc', 'Some warning', myArray)`
 *
 * @param fileName Name of file where logging from
 * @param functionName Name of function where logging from
 * @param message Message to log
 * @param args Additional values to log
 */
export const logger = {
  debug: (fileName: string, functionName: string, message: string, ...args: unknown[]): void =>
    logMessage('debug', fileName, functionName, message, ...args),
  info: (fileName: string, functionName: string, message: string, ...args: unknown[]): void =>
    logMessage('info', fileName, functionName, message, ...args),
  warn: (fileName: string, functionName: string, message: string, ...args: unknown[]): void =>
    logMessage('warn', fileName, functionName, message, ...args),
  error: (error: unknown, captureContext: LoggerErrorContext): void =>
    logException(error, captureContext),
}

function logMessage(
  level: LogLevel,
  fileName: string,
  functionName: string,
  message: string,
  ...args: unknown[] // arbitrary extra data - ideally formatted as key value pairs
): void {
  if (__DEV__) {
    console[level](formatMessage(fileName, functionName, message), ...args)
    return
  }

  if (level === 'warn') {
    Sentry.captureMessage('warning', `${fileName}#${functionName}`, message, ...args)
  } else if (level === 'info') {
    Sentry.captureMessage('info', `${fileName}#${functionName}`, message, ...args)
  }
}

function logException(error: unknown, captureContext: LoggerErrorContext): void {
  const errorMessage = errorToString(error)
  const fileName = captureContext?.tags.file ?? ''
  const functionName = captureContext?.tags.function ?? ''

  if (__DEV__) {
    console.error(formatMessage(fileName, functionName, errorMessage), captureContext)
    return
  }

  // Limit character length for string tags to the max Sentry allows
  for (const contextProp of Object.keys(captureContext.tags)) {
    const prop = contextProp as 'file' | 'function'
    const contextValue = captureContext.tags[prop]
    if (typeof contextValue === 'string') {
      captureContext.tags[prop] = contextValue.slice(0, SENTRY_CHAR_LIMIT)
    }
  }

  Sentry.captureException(error, captureContext)
}

function formatMessage(fileName: string, functionName: string, message: string): string {
  const t = new Date()
  return `${t.getHours()}:${t.getMinutes()}:${t.getSeconds()}:${t.getMilliseconds()}::${fileName}#${functionName}:${message}`
}
