/* eslint-disable no-console */

import { config } from 'src/config'
// actually calls `logException`
// eslint-disable-next-line no-restricted-imports
import { logException } from 'src/features/telemetry'

// Cache of the last n messages, n is config.logBufferSize
const logBuffer = new Array<string>(config.logBufferSize)
let logBufferIndex = 0

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// Example: logger.warn('myFile','myFunc','Some warning',myArray)
export const logger = {
  debug: (fileName: string, functionName: string, message: string, ...args: unknown[]): void =>
    logMessage('debug', fileName, functionName, message, ...args),
  info: (fileName: string, functionName: string, message: string, ...args: unknown[]): void =>
    logMessage('info', fileName, functionName, message, ...args),
  warn: (fileName: string, functionName: string, message: string, ...args: unknown[]): void =>
    logMessage('warn', fileName, functionName, message, ...args),
  error: (fileName: string, functionName: string, message: string, ...args: unknown[]): void =>
    logMessage('error', fileName, functionName, message, ...args),
}

function logMessage(
  level: LogLevel,
  fileName: string,
  functionName: string,
  message: string,
  ...args: unknown[]
): void {
  if (!fileName || !message) {
    console.warn('Invalid log message format, skipping')
    return
  }
  functionName ||= fileName // To allow omitting function when it's same as file
  const formatted = formatMessage(fileName, functionName, message)

  console[level](formatted, ...args)
  if (level === 'error') {
    logException(`${fileName}#${functionName}`, message)
  }

  logBuffer[logBufferIndex] = level + '::' + formatted + argsToString(args)
  logBufferIndex = (logBufferIndex + 1) % config.logBufferSize
}

function formatMessage(fileName: string, functionName: string, message: string): string {
  const t = new Date()
  return `${t.getHours()}:${t.getMinutes()}:${t.getSeconds()}:${t.getMilliseconds()}::${fileName}#${functionName}:${message}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function argsToString(args: any[]): string {
  if (!args || !args.length) return ''
  return args
    .map((a) => a?.toString?.())
    .filter((a) => a)
    .join(',')
}

export function getLogBuffer(): string[] {
  const logs: string[] = []
  for (let i = 0; i < config.logBufferSize; i++) {
    const nextIndex = (i + logBufferIndex) % config.logBufferSize
    const log = logBuffer[nextIndex]
    if (log) logs.push(log)
  }
  return logs
}
