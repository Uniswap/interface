import { Account } from 'src/features/wallet/accounts/types'

export interface TransferTokenParams {
  account: Account
  tokenAddress: Address
  amount: string
  toAddress: Address
}
