import { CollectionDocument } from '../../src/graphql/data/__generated__/types-and-hooks'
import client from '../client'

export default async function getCollection(collectionAddress: string, url: string) {
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
    title: collection.name + ' on Uniswap',
    image: collection.image?.url,
    url,
  }
  return formattedAsset
}
