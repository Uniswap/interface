import {
  type ActionCreatorWithoutPayload,
  type ActionCreatorWithPayload,
  combineReducers,
  createAction,
  createReducer,
  type PayloadActionCreator,
  type Reducer,
} from '@reduxjs/toolkit'
import { type ReducerWithInitialState } from '@reduxjs/toolkit/dist/createReducer'
import { useSelector } from 'react-redux'
import { type PersistState, REHYDRATE } from 'redux-persist'
import type { SagaIterator } from 'redux-saga'
import { call, delay, put, race, select, take, takeEvery } from 'typed-redux-saga'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { errorToString } from 'utilities/src/errors'
import { logger } from 'utilities/src/logger/logger'

const DEFAULT_TIMEOUT = 90 * 1000 // 1.5 minutes

/**
 * A convenience utility to create a saga and trigger action
 * Use to create simple sagas, for more complex ones use createMonitoredSaga.
 * Note: the wrapped saga this returns must be added to rootSaga.ts
 */
export function createSaga<SagaParams, SagaYieldType, SagaResultType>(
  saga: (params: SagaParams) => Generator<SagaYieldType, SagaResultType, unknown>,
  name: string,
): {
  wrappedSaga: () => Generator<unknown, void, unknown>
  actions: {
    trigger: PayloadActionCreator<SagaParams>
  }
} {
  const triggerAction = createAction<SagaParams>(`${name}/trigger`)

  const wrappedSaga = function* () {
    while (true) {
      try {
        const trigger = yield* take<{ type: typeof triggerAction.type; payload: SagaParams }>(triggerAction.type)
        logger.debug('saga', 'wrappedSaga', `${name} triggered`)
        yield* call(saga, trigger.payload)
        logger.debug('saga', 'wrappedSaga', `${name} completed`)
      } catch (error) {
        logger.error(error, {
          tags: { file: 'utils/saga', function: 'createSaga' },
          extra: { sagaName: name },
        })
      }
    }
  }

  return {
    wrappedSaga,
    actions: {
      trigger: triggerAction,
    },
  }
}

export enum SagaStatus {
  Started = 'SagaStarted',
  Success = 'SagaSuccess',
  Failure = 'SagaFailure',
}

export interface SagaState {
  status: Nullable<SagaStatus>
  error: Nullable<string> // error details
}

/**
 * Additional options for the monitored saga
 * If retry / or other options are ever needed, they can go here
 */
interface MonitoredSagaOptions {
  timeoutDuration?: number // in milliseconds
  /** When true, skip dispatch a notification. Defaults to true */
  showErrorNotification?: boolean
  /** Errors we exect to happen should not be logged to Datadog */
  doNotLogErrors?: Array<string>
  /**
   * When true, use takeEvery to allow multiple saga instances to run in parallel
   * note: cancel action will cancel ALL running instances when parallel is true
   */
  parallel?: boolean
}

// biome-ignore lint/suspicious/noExplicitAny: Generic saga state interface needs flexible typing
export interface MonitoredSaga<SagaParams = any> {
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
}): MonitoredSaga<SagaParams> {
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

  // Handler for a single trigger - extracted to support both serial and parallel modes
  function* handleTrigger(trigger: { type: typeof triggerAction.type; payload: SagaParams }) {
    try {
      logger.debug('saga', 'monitoredSaga', `${name} triggered`)
      yield* put(statusAction(SagaStatus.Started))
      const { result, cancel, timeout } = yield* race({
        result: call(saga, trigger.payload),
        cancel: take(cancelAction.type),
        timeout: delay(options?.timeoutDuration || DEFAULT_TIMEOUT),
      })

      if (cancel) {
        logger.debug('saga', 'monitoredSaga', `${name} canceled`)
        yield* put(errorAction('Action was cancelled.'))
        return
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

  const wrappedSaga = options?.parallel
    ? function* () {
        yield* takeEvery(triggerAction.type, handleTrigger)
      }
    : function* () {
        while (true) {
          const trigger = yield* take<{ type: typeof triggerAction.type; payload: SagaParams }>(triggerAction.type)
          yield* call(handleTrigger, trigger)
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

export type MonitoredSagaReducer = Reducer<Record<string, SagaState>>

export function getMonitoredSagaReducers(monitoredSagas: Record<string, MonitoredSaga>): MonitoredSagaReducer {
  return combineReducers(
    Object.keys(monitoredSagas).reduce((acc: { [name: string]: Reducer<SagaState> }, sagaName: string) => {
      // Safe non-null assertion because key `sagaName` comes from `Object.keys(monitoredSagas)`
      // biome-ignore lint/style/noNonNullAssertion: Safe assertion in test or migration context
      acc[sagaName] = monitoredSagas[sagaName]!.reducer
      return acc
    }, {}),
  )
}

// Convenience hook to get the status + error of an active saga
export function useMonitoredSagaStatus<StoreState extends { saga?: Record<string, SagaState> }>(
  sagaName: string,
): SagaState {
  const sagaState = useSelector((s: StoreState): SagaState | undefined => s.saga?.[sagaName])
  if (!sagaState) {
    return { status: null, error: null }
  }
  return sagaState
}

// Below are global, stateless transaction flow actions that are not specific to any one saga.
// This allows cross-platform code to generically interrupt or cancel an active transaction flow
// without being coupled to a specific package's transaction flow implementation.

/** Transaction flow 'interruption' actions are handled gracefully within a saga, see the `watchForInterruption` util. */
export const interruptTransactionFlow = createAction<void>(`interruptTransactionFlow`)

/** Signal that the swap modal was closed while a plan is executing. Unlike interruption, this does not stop the saga. */
export const signalSwapModalClosed = createAction<void>(`signalSwapModalClosed`)

/**
 * Signal that a plan has been cancelled by the user from the activity history.
 * Unlike other signal actions, this includes planId because multiple plan instances can run
 * simultaneously (particularly in extension), so we need to cancel the specific plan.
 */
export const signalPlanCancellation = createAction<{ planId: string }>(`saga/planCancellation`)

export function* waitForRehydration() {
  // First check if already rehydrated (might have happened before saga started)
  const alreadyRehydrated = yield* call(getIsRehydrated)
  if (alreadyRehydrated) {
    return
  }

  // Wait for the persist/REHYDRATE action that sets the rehydrated flag
  while (true) {
    yield* take(REHYDRATE)
    const isRehydrated = yield* call(getIsRehydrated)
    if (isRehydrated) {
      break
    }
  }
}

function* getIsRehydrated(): SagaIterator<boolean | undefined> {
  return yield* select((state: { _persist?: PersistState }): boolean | undefined => state._persist?.rehydrated)
}
