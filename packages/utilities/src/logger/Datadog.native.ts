/* eslint-disable @typescript-eslint/no-explicit-any */
import { DdLogs, DdRum, ErrorSource, RumActionType } from '@datadog/mobile-react-native'
import dayjs from 'dayjs'
import { AnyAction, PreloadedState, Reducer, StoreEnhancerStoreCreator } from 'redux'
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
  DdLogs.warn(message, {
    ...options,
    reduxState,
  }).catch(() => {})
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
  DdLogs.info(message, {
    ...options,
    reduxState,
  }).catch(() => {})
}
