/* eslint-disable import/no-unused-modules */
import { MetaTagInjector } from '../../components/metaTagInjector'
import getAsset from '../../utils/getAsset'
import { getCache, putCache } from '../../utils/useCache'

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const { index } = params
  const collectionAddress = index[0]?.toString()
  const tokenId = index[1]?.toString()
  const assetPromise = getAsset(collectionAddress, tokenId, request.url)
  const resPromise = next()
  const cachePromise = getCache(request.url, 'assets-cache')
  try {
    const [graphData, cacheResponse, res] = await Promise.all([assetPromise, cachePromise, resPromise])
    if (cacheResponse) {
      return new HTMLRewriter().on('head', new MetaTagInjector(cacheResponse)).transform(res)
    } else {
      if (!graphData) {
        return resPromise
      }
      await putCache(new Response(JSON.stringify(graphData)), request.url, 'assets-cache')
      return new HTMLRewriter().on('head', new MetaTagInjector(graphData)).transform(res)
    }
  } catch (e) {
    return resPromise
  }
}
