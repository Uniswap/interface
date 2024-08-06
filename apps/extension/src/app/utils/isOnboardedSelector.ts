import { RootState } from 'wallet/src/state'

export const isOnboardedSelector: (state: RootState) => boolean = (state: RootState) => {
  return Object.values(state.wallet.accounts).length > 0
}
