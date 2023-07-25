/* eslint-disable import/no-unused-modules */
import { MetaTagInjector } from '../components/metaTagInjector'
import getToken from '../utils/getToken'

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
    const cache = caches.default
    const response = await cache.match(request.url)
    if (response) {
      const data = JSON.parse(await response.text())
      return new HTMLRewriter().on('head', new MetaTagInjector(data)).transform(await resPromise)
    } else {
      const [data, res] = await Promise.all([tokenPromise, resPromise])
      if (!data) {
        return resPromise
      }
      const response = new Response(JSON.stringify(data))
      await cache.put(request.url, response)
      return new HTMLRewriter().on('head', new MetaTagInjector(data)).transform(res)
    }
  } catch (e) {
    return resPromise
  }
}
