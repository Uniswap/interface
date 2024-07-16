import { AppSelector } from 'wallet/src/state'

export const isOnboardedSelector: AppSelector<boolean> = (state) => {
  return Object.values(state.wallet.accounts).length > 0
}
