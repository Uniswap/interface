import {
  ActionCreatorWithoutPayload,
  ActionCreatorWithPayload,
  createAction,
  createReducer,
  PayloadActionCreator,
} from '@reduxjs/toolkit'
import { ReducerWithInitialState } from '@reduxjs/toolkit/dist/createReducer'
import { call, delay, put, race, take } from 'typed-redux-saga'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { errorToString } from 'utilities/src/errors'
import { logger } from 'utilities/src/logger/logger'

const DEFAULT_TIMEOUT = 90 * 1000 // 1.5 minutes

export enum SagaStatus {
  Started = 'SagaStarted',
  Success = 'SagaSuccess',
  Failure = 'SagaFailure',
}

export interface SagaState {
  status: Nullable<SagaStatus>
  error: Nullable<string> // error details
}

interface MonitoredSagaOptions {
  timeoutDuration?: number // in milliseconds
  // when true, skip dispatch a notification. Defaults to true
  showErrorNotification?: boolean
  // errors we exect to happen should not be logged to Datadog
  doNotLogErrors?: Array<string>
  // If retry / or other options are ever needed, they can go here
}

/**
 * A convenience utility to create a wrapped saga that handles common concerns like
 * trigger watching, cancel watching, timeout, progress updates, and success/fail updates.
 * Use to create complex sagas that need more coordination with the UI.
 * Note: the wrapped saga and reducer this returns must be added to rootSaga.ts
 */
export function createMonitoredSaga<SagaParams, SagaYieldType, SagaResultType>({
  saga,
  name,
  options,
}: {
  saga: (params: SagaParams) => Generator<SagaYieldType, SagaResultType, unknown>
  name: string
  options?: MonitoredSagaOptions
}): {
  name: string
  wrappedSaga: () => Generator
  reducer: ReducerWithInitialState<SagaState>
  actions: {
    trigger: PayloadActionCreator<SagaParams>
    cancel: ActionCreatorWithoutPayload
    progress: ActionCreatorWithPayload<SagaStatus, string>
    error: ActionCreatorWithPayload<string, string>
    reset: ActionCreatorWithoutPayload
  }
} {
  const triggerAction = createAction<SagaParams>(`${name}/trigger`)
  const cancelAction = createAction<void>(`${name}/cancel`)
  const statusAction = createAction<SagaStatus>(`${name}/progress`)
  const errorAction = createAction<string>(`${name}/error`)
  const resetAction = createAction<void>(`${name}/reset`)

  const reducer = createReducer<SagaState>({ status: null, error: null }, (builder) =>
    builder
      .addCase(statusAction, (state, action) => {
        state.status = action.payload
        state.error = null
      })
      .addCase(errorAction, (state, action) => {
        state.status = SagaStatus.Failure
        state.error = action.payload
      })
      .addCase(resetAction, (state) => {
        state.status = null
        state.error = null
      }),
  )

  const wrappedSaga = function* () {
    while (true) {
      try {
        const trigger = yield* take<{ type: typeof triggerAction.type; payload: SagaParams }>(triggerAction.type)
        logger.debug('saga', 'monitoredSaga', `${name} triggered`)
        yield* put(statusAction(SagaStatus.Started))
        const { result, cancel, timeout } = yield* race({
          // Note: Use fork here instead if parallelism is required for the saga
          result: call(saga, trigger.payload),
          cancel: take(cancelAction.type),
          timeout: delay(options?.timeoutDuration || DEFAULT_TIMEOUT),
        })

        if (cancel) {
          logger.debug('saga', 'monitoredSaga', `${name} canceled`)
          yield* put(errorAction('Action was cancelled.'))
          continue
        }

        if (timeout) {
          logger.warn('saga', 'monitoredSaga', `${name} timed out`)
          throw new Error('Action timed out.')
        }

        if (result === false) {
          logger.warn('saga', 'monitoredSaga', `${name} returned failure result`)
          throw new Error('Action returned failure result.')
        }

        yield* put(statusAction(SagaStatus.Success))
        logger.debug('saga', 'monitoredSaga', `${name} finished`)
      } catch (error) {
        const errorMessage = errorToString(error)
        if (!options?.doNotLogErrors?.includes(errorMessage)) {
          logger.error(error, {
            tags: { file: 'utils/saga', function: 'createMonitoredSaga' },
            extra: { sagaName: name },
          })
        }
        yield* put(errorAction(errorMessage))
        if (options?.showErrorNotification === undefined || options.showErrorNotification) {
          yield* put(
            pushNotification({
              type: AppNotificationType.Error,
              errorMessage,
            }),
          )
        }
      }
    }
  }

  return {
    name,
    wrappedSaga,
    reducer,
    actions: {
      trigger: triggerAction,
      cancel: cancelAction,
      progress: statusAction,
      error: errorAction,
      reset: resetAction,
    },
  }
}
