/* eslint-disable import/no-unused-modules */
import { MetaTagInjector } from '../../components/metaTagInjector'
import getAsset from '../../utils/getAsset'

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const { index } = params
  const collectionAddress = String(index[0])
  const tokenId = String(index[1])
  const cache = caches.default
  const assetPromise = getAsset(collectionAddress, tokenId, request.url)
  const resPromise = next()
  const cachePromise = cache.match(request.url)
  try {
    const [graphData, cacheResponse, res] = await Promise.all([assetPromise, cachePromise, resPromise])
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
