/* eslint-disable @typescript-eslint/no-explicit-any */
import { DdLogs, DdRum, DdSdkReactNative, ErrorSource, RumActionType } from '@datadog/mobile-react-native'
import dayjs from 'dayjs'
import { AnyAction, PreloadedState, Reducer, StoreEnhancerStoreCreator } from 'redux'
import { addErrorExtras } from 'utilities/src/logger/logger'
import { LogLevel, LoggerErrorContext } from 'utilities/src/logger/types'

interface Action<T = unknown> {
  type: T
}

let reduxState: unknown

interface Config {
  shouldLogReduxState: (state: any) => boolean
}

// Inspired by Sentry createReduxEnhancer
// https://github.com/getsentry/sentry-javascript/blob/master/packages/react/src/redux.ts
export function createDatadogReduxEnhancer({
  shouldLogReduxState,
}: Config): (next: StoreEnhancerStoreCreator) => StoreEnhancerStoreCreator {
  return (next: StoreEnhancerStoreCreator): StoreEnhancerStoreCreator =>
    <S = any, A extends Action = AnyAction>(reducer: Reducer<S, A>, initialState?: PreloadedState<S>) => {
      const enhancedReducer: Reducer<S, A> = (state, action): S => {
        const newState = reducer(state, action)

        reduxState = shouldLogReduxState(newState) ? newState : undefined

        /* Log action to Datadog */
        if (typeof action !== 'undefined' && action !== null) {
          DdRum.addAction(RumActionType.CUSTOM, `Redux Action: ${action.type}`, action, dayjs().valueOf()).catch(
            () => undefined,
          )
        }

        return newState
      }

      return next(enhancedReducer, initialState)
    }
}

export function logErrorToDatadog(error: Error, context: LoggerErrorContext): void {
  DdRum.addError(error.message, ErrorSource.SOURCE, error.stack ?? '', { ...context, reduxState }, Date.now()).catch(
    () => {},
  )
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
 * and log the error to the logger, which will send it to sentry and/or datadog
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
        // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
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
  await DdSdkReactNative.setAttributes(attributes)
}
