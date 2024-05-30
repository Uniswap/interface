import { PersistedState } from 'redux-persist'

/**
 * Initial migration as a proof of concept.
 *
 * Legacy migration from redux-localstorage-simple happens in legacy.ts
 */
export const migration0 = (state: PersistedState) => {
  return state
}
