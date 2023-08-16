import { CollectionDocument, CollectionQuery } from '../../src/graphql/data/__generated__/types-and-hooks'
import client from '../client'

export default async function getCollection(collectionAddress: string, url: string) {
  const origin = new URL(url).origin
  const image = origin + '/api/image/nfts/collection/' + collectionAddress
  const { data } = await client.query<CollectionQuery>({
    query: CollectionDocument,
    variables: {
      addresses: collectionAddress,
    },
  })
  const collection = data?.nftCollections?.edges[0]?.node
  if (!collection || !collection.name) {
    return undefined
  }

  const description =
    collection.description
      ?.replace(/(\r\n|\n|\r)/gm, '')
      .split('. ')
      .slice(0, 2)
      .join('. ') ?? 'Better prices. More listings. NFTs on Uniswap.'

  const formattedAsset = {
    title: collection.name + ' on Uniswap',
    image,
    url,
    description,
    name: collection.name ?? 'Collection',
    ogImage: collection.image?.url ?? origin + '/images/192x192_App_Icon.png',
    isVerified: collection.isVerified ?? false,
  }
  return formattedAsset
}
