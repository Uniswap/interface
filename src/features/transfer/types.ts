import { AccountStub } from 'src/features/wallet/accounts/types'

export interface TransferTokenParams {
  account: AccountStub
  tokenAddress: string
  amount: string
  toAddress: string
}
