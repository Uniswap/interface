import { Action, Reducer } from 'redux'
import { logger } from 'utilities/src/logger/logger'

// We use `any` in a few places in this file because those values truly can be anything, so that's the proper type.

// biome-ignore lint/suspicious/noExplicitAny: PersistPartial type allows any shape for redux-persist compatibility
type PersistPartial = { _persist: undefined } | any

export function enhancePersistReducer<S, A extends Action = Action>(
  reducer: Reducer<S & PersistPartial, A>,
): Reducer<S & PersistPartial, A> {
  return forceRehydrationFromDiskWhenResumingPersistence(reducer)
}

/**
 * Whenever the `persist/PERSIST` action is dispatched, we reset the `_persist` state in order to trigger rehydration from disk
 * regardless of whether it had already rehydrated during startup.
 *
 * Whenever another app becomes the primary instance, `storeSynchronization.ts` calls `persistor.pause()`,
 * and then when this app becomes primary again we need to not only re-start persistance but also rehydrate from disk.
 * We do this by calling `persistor.persist()`, which by default will just continue persisting and skip rehydration.
 * This custom enhancer ensures that the `_persist` state is reset whenever the `persist/PERSIST` action is dispatched,
 * so that the internal `redux-persist` logic will rehydrate from disk again.
 *
 * See relevat `redux-persist` code here: https://github.com/rt2zz/redux-persist/blob/9c0baee/src/persistReducer.ts#L110
 */
function forceRehydrationFromDiskWhenResumingPersistence<S, A extends Action = Action>(
  reducer: Reducer<S & PersistPartial, A>,
): Reducer<S & PersistPartial, A> {
  return (state, action) => {
    if (action.type !== 'persist/PERSIST') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return reducer(state, action)
    }

    logger.debug('store-synchronization', 'enhancePersistReducer', 'Resetting redux _persist state')

    const newState = {
      ...state,
      _persist: undefined,
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return reducer(newState, action)
  }
}
