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
