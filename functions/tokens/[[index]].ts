/* eslint-disable import/no-unused-modules */
import { MetaTagInjector } from '../components/metaTagInjector'
import getToken from '../utils/getToken'
import { getCache, putCache } from '../utils/useCache'

const convertTokenAddress = (tokenAddress: string) => {
  return tokenAddress && tokenAddress === 'NATIVE' ? '0x0000000000000000000000000000000000000000' : tokenAddress
}

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const { index } = params
  const networkName = index[0]?.toString().toUpperCase()
  const tokenAddress = convertTokenAddress(index[1]?.toString())
  if (!tokenAddress) {
    return next()
  }
  const tokenPromise = getToken(networkName, tokenAddress, request.url)
  const resPromise = next()
  const cachePromise = getCache(request.url, 'tokens-cache')
  try {
    const [graphData, cacheResponse, res] = await Promise.all([tokenPromise, cachePromise, resPromise])
    if (cacheResponse) {
      return new HTMLRewriter().on('head', new MetaTagInjector(cacheResponse)).transform(res)
    } else {
      if (!graphData) {
        return resPromise
      }
      await putCache(new Response(JSON.stringify(graphData)), request.url, 'tokens-cache')
      return new HTMLRewriter().on('head', new MetaTagInjector(graphData)).transform(res)
    }
  } catch (e) {
    return resPromise
  }
}
