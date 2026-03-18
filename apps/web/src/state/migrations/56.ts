import { PersistState } from 'redux-persist'

type PersistAppStateWithSignatures = {
  _persist: PersistState
  signatures?: unknown
}
/**
 * Migration 56: Remove unused 'signatures' field from state
 * This field was added in migrations 30-31 but has been migrated to the transactions slice
 */
export const migration56 = (state: PersistAppStateWithSignatures | undefined) => {
  if (!state) {
    return undefined
  }
  // biome-ignore lint/correctness/noUnusedVariables: Remove signatures field if it exists
  const { signatures, ...stateWithoutSignatures } = state
  return {
    ...stateWithoutSignatures,
    _persist: {
      ...state._persist,
      version: 56,
    },
  }
}
