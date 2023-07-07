import { AssetDocument } from '../../src/graphql/data/__generated__/types-and-hooks'
import { getApolloClient } from './getApolloClient'

export default async function getAsset(collectionAddress: string, tokenId: string, url: string) {
  const origin = new URL(url).origin
  const imageUrl = origin + '/api/image/nfts/asset/' + collectionAddress + '/' + tokenId
  const client = getApolloClient()
  const { data } = await client.query({
    query: AssetDocument,
    variables: {
      address: collectionAddress,
      filter: {
        tokenIds: [tokenId],
      },
    },
  })
  const asset = data?.nftAssets?.edges[0]?.node
  if (!asset) {
    return undefined
  }
  const listing = asset.listings.edges[0]?.node
  const listingInfo = listing
    ? `Currently listed on ${listing.marketplace} for ${listing.price.value} ETH`
    : 'Not currently listed'
  const formattedAsset = {
    id: asset.id,
    tokenId: asset.tokenId,
    address: collectionAddress,
    name: asset.name ? asset.name : asset.collection?.name + ' #' + asset.tokenId,
    image: imageUrl,
    collectionName: asset.collection?.name,
    rarity: asset.rarities?.[0]?.rank,
    uniswapUrl: url,
    listing: listingInfo,
  }
  return formattedAsset
}
