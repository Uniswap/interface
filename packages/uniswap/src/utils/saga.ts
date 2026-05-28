import { createAction, PayloadActionCreator } from '@reduxjs/toolkit'
import { call, take } from 'typed-redux-saga'
import { logger } from 'utilities/src/logger/logger'

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

// Below are global, stateless transaction flow actions that are not specific to any one saga.
// This allows cross-platform code to generically interrupt or cancel an active transaction flow
// without being coupled to a specific package's transaction flow implementation.

/** Transaction flow 'interruption' actions are handled gracefully within a saga, see the `watchForInterruption` util. */
export const interruptTransactionFlow = createAction<void>(`interruptTransactionFlow`)
