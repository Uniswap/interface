import type { AppSelector } from 'wallet/src/state'

export const isOnboardedSelector: AppSelector<boolean> = (state) =>
  Object.keys(state.wallet.accounts).length > 0
