import { NotImplementedError } from 'utilities/src/errors'
import { LogLevel, LoggerErrorContext } from 'utilities/src/logger/types'

export function setupDatadog(): void {
  throw new NotImplementedError('Please use the web implementation from Datadog.web.ts')
}

export function logToDatadog(
  _message: string,
  _options: {
    level: LogLevel
    args: unknown[]
    fileName: string
    functionName: string
  },
): void {
  throw new NotImplementedError('Please use the web / native implementation from Datadog.web.ts or Datadog.native.ts')
}

export function logWarningToDatadog(
  _message: string,
  _options: {
    level: LogLevel
    args: unknown[]
    fileName: string
    functionName: string
  },
): void {
  throw new NotImplementedError('Please use the web / native implementation from Datadog.web.ts or Datadog.native.ts')
}

export function logErrorToDatadog(_error: Error, _context?: LoggerErrorContext): void {
  throw new NotImplementedError('Please use the web / native implementation from Datadog.web.ts or Datadog.native.ts')
}
