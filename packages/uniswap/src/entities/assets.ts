import { UniverseChainId } from 'uniswap/src/features/chains/types'

export type TradeableAsset = CurrencyAsset | NFTAsset

interface BaseTradeableAsset {
  address: Address
  chainId: UniverseChainId
  type: AssetType
}

export interface CurrencyAsset extends BaseTradeableAsset {
  type: AssetType.Currency
}

export interface NFTAsset extends BaseTradeableAsset {
  type: NFTAssetType
  tokenId: string
}

export enum AssetType {
  Currency = 'currency',
  ERC721 = 'erc-721',
  ERC1155 = 'erc-1155',
}
export type NFTAssetType = AssetType.ERC721 | AssetType.ERC1155
