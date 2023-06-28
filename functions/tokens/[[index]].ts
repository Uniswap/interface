/* eslint-disable import/no-unused-modules */
import { TokenDocument } from '../../src/graphql/data/__generated__/types-and-hooks'
import { getApolloClient } from '../utils/getApolloClient'
import { MetaTagInjector } from './tokenInjector'

export const onRequest: PagesFunction<{}> = async ({ params, request, env, next }) => {
  try {
    const { index } = params
    const networkName = String(index[0]).toUpperCase()
    let tokenAddress = String(index[1])
    tokenAddress =
      tokenAddress !== 'undefined' && tokenAddress === 'NATIVE'
        ? '0x0000000000000000000000000000000000000000'
        : tokenAddress
    const client = getApolloClient()
    const { data } = await client.query({
      query: TokenDocument,
      variables: {
        chain: networkName,
        address: tokenAddress,
      },
    })
    const asset = data?.token
    if (!asset) {
      return await next()
    }
    const formattedAsset = {
      name: asset.name,
      network: networkName,
      price: asset.market?.price?.value ? asset.market.price.value : 0,
      image: asset.project?.logoUrl,
      uniswapUrl: request.url,
      symbol: asset.symbol,
    }
    return new HTMLRewriter().on('head', new MetaTagInjector(formattedAsset)).transform(await next())
  } catch (e) {
    console.log(e)
    return await next()
  }
}
