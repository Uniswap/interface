import { UniverseChainId } from 'uniswap/src/features/chains/types'

export type NFTItem = {
  chainId?: UniverseChainId
  contractAddress?: string
  tokenId?: string
  name?: string
  description?: string
  imageUrl?: string
  imageDimensions?: { width: number; height: number }
  thumbnailUrl?: string
  collectionName?: string
  isSpam?: boolean
}
