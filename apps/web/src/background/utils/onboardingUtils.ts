import { Account } from 'wallet/src/features/wallet/accounts/types'
import { AppSelector } from 'wallet/src/state'

export const isOnboardedSelector: AppSelector<boolean> = (state) => {
  return Object.values(state.wallet.accounts).filter((a: Account) => a.pending === false).length > 0
}
