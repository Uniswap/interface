import type { AppSelector } from 'app/src/state'

export const isOnboardedSelector: AppSelector<boolean> = (state) =>
  Object.keys(state.wallet.accounts).length > 0
