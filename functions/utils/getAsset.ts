import { AssetDocument } from '../../src/graphql/data/__generated__/types-and-hooks'
import { getApolloClient } from './getApolloClient'

export default async function getAsset(collectionAddress: string, tokenId: string, url: string) {
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
  const formattedAsset = {
    name: asset.name ? asset.name : asset.collection?.name + ' #' + asset.tokenId,
    image: asset.image?.url,
    uniswapUrl: url,
  }
  return formattedAsset
}
