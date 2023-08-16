/* eslint-disable no-console */
import { Primitive, ScopeContext } from '@sentry/types'
import { errorToString } from 'utilities/src/errors'
import { Sentry } from './Sentry'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LoggerErrorContext = Partial<ScopeContext> & {
  tags: { file: string; function: string; [key: string]: Primitive }
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

  Sentry.captureException(error, captureContext)
}

function formatMessage(fileName: string, functionName: string, message: string): string {
  const t = new Date()
  return `${t.getHours()}:${t.getMinutes()}:${t.getSeconds()}:${t.getMilliseconds()}::${fileName}#${functionName}:${message}`
}
