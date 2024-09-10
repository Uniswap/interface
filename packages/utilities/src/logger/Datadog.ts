/* eslint-disable @typescript-eslint/no-explicit-any */
import { StoreEnhancerStoreCreator } from 'redux'
import { NotImplementedError } from 'utilities/src/errors'
import { LogLevel, LoggerErrorContext } from 'utilities/src/logger/types'

export function setupDatadog(): void {
  throw new NotImplementedError('Please use the web implementation from Datadog.web.ts')
}

interface Config {
  shouldLogReduxState: (state: any) => boolean
}

export function createDatadogReduxEnhancer(
  _config: Config,
): (next: StoreEnhancerStoreCreator) => StoreEnhancerStoreCreator {
  throw new NotImplementedError('createDatadogReduxEnhancer')
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

export function attachUnhandledRejectionHandler(): void {
  throw new NotImplementedError('attachUnhandledRejectionHandler')
}
