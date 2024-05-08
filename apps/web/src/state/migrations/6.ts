import { ConnectionType } from 'connection/types'
import { PersistState } from 'redux-persist'
import { UserState } from 'state/user/reducer'

export type PersistAppStateV6 = {
  _persist: PersistState
} & { user?: UserState & { selectedWallet?: ConnectionType } }

/**
 * Migration to replace selected wallet with recentConnectionMeta in user state
 */
export const migration6 = (state: PersistAppStateV6 | undefined) => {
  if (!state) return state
  // Remove a previously-persisted variable
  if (state?.user && 'selectedWallet' in state.user) {
    const connectionType = state.user.selectedWallet
    if (connectionType !== undefined) {
      state.user.recentConnectionMeta = { type: connectionType }
    }
    delete state.user['selectedWallet']
  }
  return {
    ...state,
    _persist: {
      ...state._persist,
      version: 6,
    },
  }
}
