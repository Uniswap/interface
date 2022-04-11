import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { Account } from 'src/features/wallet/accounts/types'

interface BaseTransferParams {
  account: Account
  chainId: ChainId
  toAddress: Address
  tokenAddress: Address
}

export interface TransferCurrencyParams extends BaseTransferParams {
  amountInWei: string
  type: AssetType.Currency
}

export interface TransferNFTParams extends BaseTransferParams {
  tokenId: string
  type: AssetType.NFT
}

export type TransferTokenParams = TransferCurrencyParams | TransferNFTParams
