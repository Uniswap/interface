import { PersistedState } from 'redux-persist'

export const migration50 = (state: PersistedState): PersistedState => {
  return {
    ...state,
    userSettings: {
      ...(state as any).userSettings,
      isTestnetModeEnabled: true, // Force testnet mode to be enabled
    },
  }
}
