/* biome-ignore-all lint/suspicious/noExplicitAny: Third-party types not available */
import { StoreEnhancerStoreCreator } from 'redux'
import { PlatformSplitStubError } from 'utilities/src/errors'
import { LoggerErrorContext, LogLevel } from 'utilities/src/logger/types'

export interface ReduxEnhancerConfig {
  shouldLogReduxState: (state: any) => boolean
}

export function createDatadogReduxEnhancer(
  _config: ReduxEnhancerConfig,
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

export async function setAttributesToDatadog(_attributes: { [key: string]: unknown }): Promise<void> {
  throw new PlatformSplitStubError('setAttributes')
}
