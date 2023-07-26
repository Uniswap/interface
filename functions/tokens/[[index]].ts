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
  try {
    const response = await getCache(request.url, 'tokens-cache')
    if (response) {
      return new HTMLRewriter().on('head', new MetaTagInjector(response)).transform(await resPromise)
    } else {
      const [data, res] = await Promise.all([tokenPromise, resPromise])
      if (!data) {
        return resPromise
      }
      putCache(new Response(JSON.stringify(data)), request.url, 'tokens-cache')
      return new HTMLRewriter().on('head', new MetaTagInjector(data)).transform(res)
    }
  } catch (e) {
    return resPromise
  }
}
