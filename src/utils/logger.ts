/* eslint-disable no-console */

import { config } from 'src/config'

// Cache of the last n messages, n is config.logBufferSize
const logBuffer = new Array<string>(config.logBufferSize)
let logBufferIndex = 0

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// Example: logger.warn('myFile','myFunc','Some warning',myArray)
export const logger = {
  debug: (fileName: string, functionName: string, message: string, ...args: any[]) =>
    logMessage('debug', fileName, functionName, message, ...args),
  info: (fileName: string, functionName: string, message: string, ...args: any[]) =>
    logMessage('info', fileName, functionName, message, ...args),
  warn: (fileName: string, functionName: string, message: string, ...args: any[]) =>
    logMessage('warn', fileName, functionName, message, ...args),
  error: (fileName: string, functionName: string, message: string, ...args: any[]) =>
    logMessage('error', fileName, functionName, message, ...args),
}

function logMessage(
  level: LogLevel,
  fileName: string,
  functionName: string,
  message: string,
  ...args: any[]
) {
  if (!fileName || !message) {
    console.warn('Invalid log message format, skipping')
    return
  }
  functionName ||= fileName // To allow omitting function when it's same as file
  const formatted = formatMessage(fileName, functionName, message)
  console[level](formatted, ...args)
  logBuffer[logBufferIndex] = level + '::' + formatted + argsToString(args)
  logBufferIndex = (logBufferIndex + 1) % config.logBufferSize
}

function formatMessage(fileName: string, functionName: string, message: string): string {
  const t = new Date()
  return `${t.getHours()}:${t.getMinutes()}:${t.getSeconds()}:${t.getMilliseconds()}::${fileName}#${functionName}:${message}`
}

function argsToString(args: any[]): string {
  if (!args || !args.length) return ''
  return args
    .map((a) => a?.toString?.())
    .filter((a) => a)
    .join(',')
}

export function getLogBuffer() {
  const logs: string[] = []
  for (let i = 0; i < config.logBufferSize; i++) {
    const nextIndex = (i + logBufferIndex + 1) % config.logBufferSize
    if (logBuffer[nextIndex]) logs.push(logBuffer[nextIndex])
  }
  return logs
}

// Creates a logger instance scoped to a particular file for convenience
export function createLogger(fileName: string): typeof logger {
  return {
    debug: (functionName: string, message: string, ...args: any[]) =>
      logger.debug(fileName, functionName, message, ...args),
    info: (functionName: string, message: string, ...args: any[]) =>
      logger.info(fileName, functionName, message, ...args),
    warn: (functionName: string, message: string, ...args: any[]) =>
      logger.warn(fileName, functionName, message, ...args),
    error: (functionName: string, message: string, ...args: any[]) =>
      logger.error(fileName, functionName, message, ...args),
  }
}
