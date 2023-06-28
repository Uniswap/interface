import { CollectionDocument } from '../../src/graphql/data/__generated__/types-and-hooks'
import { getApolloClient } from './getApolloClient'

export default async function getCollection(collectionAddress: string, url: string) {
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
    image: collection.image?.url,
    uniswapUrl: url,
    isVerified: collection.isVerified,
  }
  return formattedAsset
}
