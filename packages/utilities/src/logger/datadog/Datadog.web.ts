import { datadogLogs } from '@datadog/browser-logs'
import { datadogRum } from '@datadog/browser-rum'
import { isExtensionApp, isWebApp, isTestEnv } from '@universe/environment'
import { NotImplementedError } from 'utilities/src/errors'
import { LoggerErrorContext, LogLevel } from 'utilities/src/logger/types'

export function logToDatadog(
  message: string,
  {
    level,
    ...options
  }: {
    level: LogLevel
    args: unknown[]
    fileName: string
    functionName: string
  },
): void {
  if (isTestEnv()) {
    return
  }
  datadogLogs.logger[level](message, options)
}

export function logWarningToDatadog(
  message: string,
  options: {
    level: LogLevel
    args: unknown[]
    fileName: string
    functionName: string
  },
): void {
  datadogLogs.logger.warn(message, options)
}

export function logErrorToDatadog(error: Error, context?: LoggerErrorContext): void {
  if (isTestEnv()) {
    return
  }

  if (isExtensionApp || isWebApp) {
    datadogRum.addError(error, context)
    return
  }

  if (error instanceof Error) {
    datadogLogs.logger.error(error.message, {
      error: {
        kind: error.name,
        stack: error.stack,
      },
      ...context,
    })
  } else {
    datadogLogs.logger.error(error, {
      error: {
        stack: new Error().stack,
      },
      ...context,
    })
  }
}

export function attachUnhandledRejectionHandler(): void {
  throw new NotImplementedError('attachUnhandledRejectionHandler')
}

/**
 * Global context for every RUM event and log line from here on. The browser SDKs keep context set
 * before `init`, so web callers need no readiness gate. The fields that reach here are the Datadog
 * allowlist; their call sites are owned by @uniswap/security in CODEOWNERS.
 */
export async function setAttributesToDatadog(attributes: { [key: string]: unknown }): Promise<void> {
  for (const [key, value] of Object.entries(attributes)) {
    datadogRum.setGlobalContextProperty(key, value)
    datadogLogs.setGlobalContextProperty(key, value)
  }
}
