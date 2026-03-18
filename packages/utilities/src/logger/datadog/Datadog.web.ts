/* biome-ignore-all lint/suspicious/noExplicitAny: Third-party types not available */
import { datadogLogs } from '@datadog/browser-logs'
import { datadogRum } from '@datadog/browser-rum'
import { Action, AnyAction, PreloadedState, Reducer, StoreEnhancerStoreCreator } from 'redux'
import { isTestEnv } from 'utilities/src/environment/env'
import { NotImplementedError } from 'utilities/src/errors'
import { ReduxEnhancerConfig } from 'utilities/src/logger/datadog/Datadog'
import { handleReduxAction } from 'utilities/src/logger/datadog/reduxUtils'
import { LoggerErrorContext, LogLevel } from 'utilities/src/logger/types'
import { isExtensionApp, isWebApp } from 'utilities/src/platform'

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
  if (isExtensionApp) {
    datadogLogs.logger[level](message, { ...options, reduxState })
  } else {
    datadogLogs.logger[level](message, options)
  }
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
  datadogLogs.logger.warn(message, { ...options, ...(isExtensionApp ? { reduxState } : {}) })
}

export function logErrorToDatadog(error: Error, context?: LoggerErrorContext): void {
  if (isTestEnv()) {
    return
  }

  if (isExtensionApp || isWebApp) {
    datadogRum.addError(error, { ...context, reduxState })
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

export async function setAttributesToDatadog(_attributes: { [key: string]: unknown }): Promise<void> {
  throw new NotImplementedError('setAttributes')
}

let reduxState: Record<string, unknown> | undefined

// Inspired by Sentry createReduxEnhancer
// https://github.com/getsentry/sentry-javascript/blob/master/packages/react/src/redux.ts
export function createDatadogReduxEnhancer({
  shouldLogReduxState,
}: ReduxEnhancerConfig): (next: StoreEnhancerStoreCreator) => StoreEnhancerStoreCreator {
  return (next: StoreEnhancerStoreCreator): StoreEnhancerStoreCreator =>
    <S = any, A extends Action = AnyAction>(reducer: Reducer<S, A>, initialState?: PreloadedState<S>) => {
      const enhancedReducer: Reducer<S, A> = (state, action): S => {
        const newState = reducer(state, action)

        const { isAction, reduxStateToLog } = handleReduxAction({
          action,
          newState,
          shouldLogState: shouldLogReduxState(newState),
        })

        if (reduxStateToLog) {
          reduxState = reduxStateToLog
        }

        /* Log action to Datadog */
        if (isAction) {
          datadogRum.addAction(`Redux Action: ${action.type}`, action)
        }

        return newState
      }

      return next(enhancedReducer, initialState)
    }
}
