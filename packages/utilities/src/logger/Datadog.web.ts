/* eslint-disable @typescript-eslint/no-explicit-any */
import { datadogLogs } from '@datadog/browser-logs'
import { datadogRum } from '@datadog/browser-rum'
import { AnyAction, PreloadedState, Reducer, StoreEnhancerStoreCreator } from 'redux'
import { isTestEnv } from 'utilities/src/environment/env'
import { NotImplementedError } from 'utilities/src/errors'
import { LogLevel, LoggerErrorContext } from 'utilities/src/logger/types'
import { isExtension } from 'utilities/src/platform'
import { v4 as uuidv4 } from 'uuid'

// setup user information
const USER_ID_KEY = 'datadog-user-id'

export function setupDatadog(envNameFunc: () => string): void {
  if (isTestEnv()) {
    return
  }
  if (!process.env.REACT_APP_DATADOG_CLIENT_TOKEN) {
    // eslint-disable-next-line no-console
    console.error(`No datadog client token, disabling`)
    return
  }

  datadogLogs.init({
    clientToken: process.env.REACT_APP_DATADOG_CLIENT_TOKEN,
    site: 'datadoghq.com',
    forwardErrorsToLogs: true,
  })

  let userId = localStorage.getItem(USER_ID_KEY)
  if (!userId) {
    localStorage.setItem(USER_ID_KEY, (userId = uuidv4()))
  }
  datadogLogs.setUser({
    id: userId,
  })

  datadogLogs.setUserProperty('env', envNameFunc())
  datadogLogs.setUserProperty('version', process.env.REACT_APP_GIT_COMMIT_HASH)
}

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
  if (isExtension) {
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
  datadogLogs.logger.warn(message, { ...options, ...(isExtension ? { reduxState } : {}) })
}

export function logErrorToDatadog(error: Error, context?: LoggerErrorContext): void {
  if (isTestEnv()) {
    return
  }

  if (isExtension) {
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

interface Action<T = unknown> {
  type: T
}

let reduxState: unknown

// Inspired by Sentry createReduxEnhancer
// https://github.com/getsentry/sentry-javascript/blob/master/packages/react/src/redux.ts
export function createDatadogReduxEnhancer({
  shouldLogReduxState,
}: {
  shouldLogReduxState: (state: any) => boolean
}): (next: StoreEnhancerStoreCreator) => StoreEnhancerStoreCreator {
  return (next: StoreEnhancerStoreCreator): StoreEnhancerStoreCreator =>
    <S = any, A extends Action = AnyAction>(reducer: Reducer<S, A>, initialState?: PreloadedState<S>) => {
      const enhancedReducer: Reducer<S, A> = (state, action): S => {
        const newState = reducer(state, action)

        reduxState = shouldLogReduxState(newState) ? newState : undefined

        /* Log action to Datadog */
        if (typeof action !== 'undefined' && action !== null) {
          datadogRum.addAction(`Redux Action: ${action.type}`, action)
        }

        return newState
      }

      return next(enhancedReducer, initialState)
    }
}
