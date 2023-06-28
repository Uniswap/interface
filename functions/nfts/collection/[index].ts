/* eslint-disable import/no-unused-modules */
import { CollectionDocument } from '../../../src/graphql/data/__generated__/types-and-hooks'
import { getApolloClient } from '../../utils/getApolloClient'
import { MetaTagInjector } from './collectionInjector'

export const onRequest: PagesFunction<{}> = async ({ params, request, env, next }) => {
  try {
    const { index } = params
    const collectionAddress = String(index)
    const client = getApolloClient()
    const { data } = await client.query({
      query: CollectionDocument,
      variables: {
        addresses: collectionAddress,
      },
    })
    const collection = data?.nftCollections?.edges[0]?.node
    if (!collection || !collection.name) {
      return await next()
    }
    const formattedAsset = {
      name: collection.name,
      image: collection.image?.url,
      uniswapUrl: request.url,
    }
    return new HTMLRewriter().on('head', new MetaTagInjector(formattedAsset)).transform(await next())
  } catch (e) {
    console.log(e)
    return await next()
  }
}
