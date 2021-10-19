import { AccountStub } from 'src/features/wallet/accounts/types'

export interface TransferTokenParams {
  account: AccountStub
  tokenAddress: Address
  amount: string
  toAddress: Address
}
