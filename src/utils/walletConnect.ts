import { Account, AccountType } from 'src/features/wallet/accounts/types'

export function isWalletConnectSupportedAccount(account: Account) {
  return account.type !== AccountType.Readonly
}
