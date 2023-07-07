import { CollectionDocument } from '../../src/graphql/data/__generated__/types-and-hooks'
import { getApolloClient } from './getApolloClient'

export default async function getCollection(collectionAddress: string, url: string) {
  const origin = new URL(url).origin
  const imageUrl = origin + '/api/image/nfts/collection/' + collectionAddress
  const client = getApolloClient()
  const { data } = await client.query({
    query: CollectionDocument,
    variables: {
      addresses: collectionAddress,
    },
  })
  const collection = data?.nftCollections?.edges[0]?.node
  if (!collection || !collection.name) {
    return undefined
  }
  const formattedAsset = {
    name: collection.name,
    image: imageUrl,
    uniswapUrl: url,
    isVerified: collection.isVerified,
  }
  return formattedAsset
}
