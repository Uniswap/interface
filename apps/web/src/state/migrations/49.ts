import { PersistState } from 'redux-persist'

type PersistAppStateWithLocalWebTransactions = {
  _persist: PersistState
  localWebTransactions?: any
}

// Migration to remove localWebTransactions from old web reducer
export const migration49 = (
  state: PersistAppStateWithLocalWebTransactions | undefined,
): Omit<PersistAppStateWithLocalWebTransactions, 'localWebTransactions'> | undefined => {
  if (!state) {
    return undefined
  }

  // biome-ignore lint/correctness/noUnusedVariables: we want to remove localWebTransactions
  const { localWebTransactions, ...restState } = state

  return {
    ...restState,
    _persist: { ...state._persist, version: 49 },
  }
}
