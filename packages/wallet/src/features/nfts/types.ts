import { IAmount } from 'wallet/src/data/__generated__/types-and-hooks'

export type NFTItem = {
  name?: string
  description?: string
  contractAddress?: string
  tokenId?: string
  imageUrl?: string
  imageDimensions?: { width: number; height: number }
  collectionName?: string
  isVerifiedCollection?: boolean
  floorPrice?: number
  ownerAddress?: string
  listPrice?: IAmount
  isSpam?: boolean
}

export type NftData = {
  isSpamIgnored?: boolean
  isHidden?: boolean
}
