import { ExtensionState } from 'src/store/extensionReducer'

export const isOnboardedSelector: (state: ExtensionState) => boolean = (state: ExtensionState) => {
  return Object.values(state.wallet.accounts).length > 0
}
