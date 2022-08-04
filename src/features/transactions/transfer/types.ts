import { Currency } from '@uniswap/sdk-core'
import { ChainId } from 'src/constants/chains'
import { AssetType, NFTAssetType } from 'src/entities/assets'
import { NFTAsset } from 'src/features/nfts/types'
import { Account } from 'src/features/wallet/accounts/types'

interface BaseTransferParams {
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
  tokenId: string
  type: NFTAssetType
}

export type TransferTokenParams = TransferCurrencyParams | TransferNFTParams

export interface InputAssetInfo {
  isNFT: boolean
  currencyIn: Currency | undefined
  nftIn: NFTAsset.Asset | undefined
  chainId: ChainId | undefined
}
