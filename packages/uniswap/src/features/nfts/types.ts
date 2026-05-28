import { GraphQLApi } from '@universe/api'

export type GQLNftAsset = NonNullable<
  NonNullable<NonNullable<NonNullable<GraphQLApi.NftsQuery['portfolios']>[0]>['nftBalances']>[0]
>['ownedAsset']

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
  listPrice?: GraphQLApi.IAmount
  isSpam?: boolean
  chain?: GraphQLApi.Chain
}
