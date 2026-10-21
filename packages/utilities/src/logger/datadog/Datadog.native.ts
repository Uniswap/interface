// oxlint-disable typescript/no-var-requires
import { DdLogs, DdRum, DdSdkReactNative, ErrorSource } from '@datadog/mobile-react-native'
import { addErrorExtras } from 'utilities/src/logger/logger'
import { LoggerErrorContext, LogLevel } from 'utilities/src/logger/types'

export function logErrorToDatadog(error: Error, context: LoggerErrorContext): void {
  DdRum.addError(error.message, ErrorSource.SOURCE, error.stack ?? '', context, Date.now()).catch(() => {})
}

export function logWarningToDatadog(
  message: string,
  {
    level: _level,
    ...options
  }: {
    level: LogLevel
    args: unknown[]
    fileName: string
    functionName: string
  },
): void {
  DdLogs.warn(message, options).catch(() => {})
}

export function logToDatadog(
  message: string,
  {
    level: _level,
    ...options
  }: {
    level: LogLevel
    args: unknown[]
    fileName: string
    functionName: string
  },
): void {
  DdLogs.info(message, options).catch(() => {})
}

/*
 * This is heavily influenced by the sentry implementation of this functionality
 * https://github.com/getsentry/sentry-react-native/blob/0abe24e037e7272178f36ffc7a5c6e295e039650/src/js/integrations/reactnativeerrorhandlersutils.ts
 *
 * This function is used to attach a handler to the global promise rejection event
 * and log the error to the logger, which will send it to datadog
 */
export function attachUnhandledRejectionHandler(): void {
  // This section sets up Promise polyfills and rejection tracking
  // to enable proper handling of unhandled rejections
  const { polyfillGlobal } = require('react-native/Libraries/Utilities/PolyfillFunctions')
  polyfillGlobal('Promise', () => require('promise/setimmediate/es6-extensions') as typeof Promise)
  require('promise/setimmediate/done')
  require('promise/setimmediate/finally')
  const tracking = require('promise/setimmediate/rejection-tracking')

  tracking.enable({
    allRejections: true,
    onUnhandled: (id: string, rejection: unknown) => {
      if (__DEV__) {
        console.warn(`Possible Unhandled Promise Rejection (id: ${id}):\n${rejection}`)
      } else {
        const error = rejection instanceof Error ? rejection : new Error(`${rejection}`)
        const context = addErrorExtras(error, {
          tags: { file: 'Datadog.native.ts', function: 'attachUnhandledRejectionHandler' },
        })
        logErrorToDatadog(error, context)
      }
    },
    onHandled: (id: string) => {
      if (__DEV__) {
        console.warn(
          `Promise Rejection Handled (id: ${id})\n` +
            'This means you can ignore any previous messages of the form ' +
            `"Possible Unhandled Promise Rejection (id: ${id}):"`,
        )
      }
    },
  })
}

export async function setAttributesToDatadog(attributes: { [key: string]: unknown }): Promise<void> {
  await DdSdkReactNative.addAttributes(attributes)
}
