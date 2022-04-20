import { ChainId } from 'src/constants/chains'
import { AssetType, NFTAssetType } from 'src/entities/assets'
import { Account } from 'src/features/wallet/accounts/types'

interface BaseTransferParams {
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
  tokenId: string
  type: NFTAssetType
}

export type TransferTokenParams = TransferCurrencyParams | TransferNFTParams
