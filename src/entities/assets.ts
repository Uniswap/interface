import { ChainId } from 'src/constants/chains'

export type TradeableAsset = CurrencyAsset | NFTAsset

interface BaseTradeableAsset {
  address: Address
  chainId: ChainId
  type: AssetType
}

export interface CurrencyAsset extends BaseTradeableAsset {
  type: AssetType.Currency
}

export interface NFTAsset extends BaseTradeableAsset {
  type: AssetType.NFT
  tokenId: string
}

export enum AssetType {
  Currency = 'currency',
  NFT = 'NFT',
}
