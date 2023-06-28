/* eslint-disable import/no-unused-modules */
import { AssetDocument } from '../../../src/graphql/data/__generated__/types-and-hooks'
import { getApolloClient } from '../../utils/getApolloClient'
import { MetaTagInjector } from './assetInjector'

export const onRequest: PagesFunction<{}> = async ({ params, request, env, next }) => {
  try {
    const { index } = params
    const collectionAddress = String(index[0])
    const tokenId = String(index[1])
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
      return await next()
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
      image: asset.image?.url,
      collectionName: asset.collection?.name,
      rarity: asset.rarities?.[0]?.rank,
      uniswapUrl: request.url,
      listing: listingInfo,
    }
    return new HTMLRewriter().on('head', new MetaTagInjector(formattedAsset)).transform(await next())
  } catch (e) {
    console.log(e)
    return await next()
  }
}
