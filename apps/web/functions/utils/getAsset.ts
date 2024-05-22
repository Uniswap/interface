import { formatNFTAssetMetatagTitleName } from 'shared-cloud/metatags'
import { AssetDocument, AssetQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import client from '../client'

export default async function getAsset(collectionAddress: string, tokenId: string, url: string) {
  const origin = new URL(url).origin
  const image = origin + '/api/image/nfts/asset/' + collectionAddress + '/' + tokenId
  const { data } = await client.query<AssetQuery>({
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
  const title = formatNFTAssetMetatagTitleName(asset.name, asset.collection?.name, asset.tokenId)
  const formattedAsset = {
    title,
    image,
    url,
    ogImage: asset.image?.url ?? origin + '/images/192x192_App_Icon.png',
  }
  return formattedAsset
}
