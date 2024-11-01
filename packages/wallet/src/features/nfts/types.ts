import { Chain, IAmount } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export type NFTItem = {
  name?: string
  description?: string
  contractAddress?: string
  tokenId?: string
  imageUrl?: string
  thumbnailUrl?: string
  imageDimensions?: { width: number; height: number }
  collectionName?: string
  isVerifiedCollection?: boolean
  floorPrice?: number
  ownerAddress?: string
  listPrice?: IAmount
  isSpam?: boolean
  chain?: Chain
}
