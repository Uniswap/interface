/* eslint-disable import/no-unused-modules */
import { MetaTagInjector } from '../components/metaTagInjector'
import getToken from '../utils/getToken'

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const { index } = params
  const networkName = String(index[0]).toUpperCase()
  let tokenAddress = String(index[1])
  tokenAddress =
    tokenAddress !== 'undefined' && tokenAddress === 'NATIVE'
      ? '0x0000000000000000000000000000000000000000'
      : tokenAddress
  const cache = caches.default
  const tokenPromise = getToken(networkName, tokenAddress, request.url)
  const resPromise = next()
  const cachePromise = cache.match(request.url)
  try {
    const [graphData, cacheResponse, res] = await Promise.all([tokenPromise, cachePromise, resPromise])
    if (cacheResponse) {
      const cacheData = JSON.parse(await cacheResponse.text())
      return new HTMLRewriter().on('head', new MetaTagInjector(cacheData)).transform(res)
    } else {
      if (!graphData) {
        return resPromise
      }
      const response = new Response(JSON.stringify(graphData))
      await cache.put(request.url, response)
      return new HTMLRewriter().on('head', new MetaTagInjector(graphData)).transform(res)
    }
  } catch (e) {
    return resPromise
  }
}
