import { ChainId } from 'src/constants/chains'
import { Account } from 'src/features/wallet/accounts/types'

export interface TransferTokenParams {
  account: Account
  toAddress: Address
  amountInWei: string
  tokenAddress: Address
  chainId: ChainId
}
