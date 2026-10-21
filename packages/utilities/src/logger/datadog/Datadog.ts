import { PlatformSplitStubError } from 'utilities/src/errors'
import type { LoggerErrorContext, LogLevel } from 'utilities/src/logger/types'

export function logToDatadog(
  _message: string,
  _options: {
    level: LogLevel
    args: unknown[]
    fileName: string
    functionName: string
  },
): void {
  throw new PlatformSplitStubError('logToDatadog')
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
  throw new PlatformSplitStubError('logWarningToDatadog')
}

export function logErrorToDatadog(_error: Error, _context?: LoggerErrorContext): void {
  throw new PlatformSplitStubError('logErrorToDatadog')
}

export function attachUnhandledRejectionHandler(): void {
  throw new PlatformSplitStubError('attachUnhandledRejectionHandler')
}

export async function setAttributesToDatadog(_attributes: { [key: string]: unknown }): Promise<void> {
  throw new PlatformSplitStubError('setAttributes')
}
