import { ChainId } from 'wallet/src/constants/chains'
import { AssetType, NFTAssetType } from 'wallet/src/entities/assets'
import { Account } from 'wallet/src/features/wallet/accounts/types'

interface BaseTransferParams {
  type: AssetType
  txId?: string
  account: Account
  chainId: ChainId
  toAddress: Address
  tokenAddress: Address
}

export interface TransferCurrencyParams extends BaseTransferParams {
  type: AssetType.Currency
  amountInWei: string
}

export interface TransferNFTParams extends BaseTransferParams {
  type: NFTAssetType
  tokenId: string
}

export type TransferTokenParams = TransferCurrencyParams | TransferNFTParams
