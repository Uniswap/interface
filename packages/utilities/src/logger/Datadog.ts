/* eslint-disable @typescript-eslint/no-explicit-any */
import { StoreEnhancerStoreCreator } from 'redux'
import { PlatformSplitStubError } from 'utilities/src/errors'
import { LogLevel, LoggerErrorContext } from 'utilities/src/logger/types'

export function setupDatadog(): void {
  throw new PlatformSplitStubError('setupDatadog')
}

interface Config {
  shouldLogReduxState: (state: any) => boolean
}

export function createDatadogReduxEnhancer(
  _config: Config,
): (next: StoreEnhancerStoreCreator) => StoreEnhancerStoreCreator {
  throw new PlatformSplitStubError('createDatadogReduxEnhancer')
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
