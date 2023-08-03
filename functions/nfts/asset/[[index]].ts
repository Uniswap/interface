/* eslint-disable import/no-unused-modules */
import { MetaTagInjector } from '../../components/metaTagInjector'
import Cache from '../../utils/cache'
import getAsset from '../../utils/getAsset'

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const resPromise = next()
  const cachePromise = Cache.match(request.url, 'assets-cache')
  try {
    const [cacheResponse, res] = await Promise.all([cachePromise, resPromise])
    if (cacheResponse) {
      return new HTMLRewriter().on('head', new MetaTagInjector(cacheResponse)).transform(res)
    } else {
      const { index } = params
      const collectionAddress = index[0]?.toString()
      const tokenId = index[1]?.toString()
      const graphData = await getAsset(collectionAddress, tokenId, request.url)
      if (!graphData) {
        return resPromise
      }
      await Cache.put(new Response(JSON.stringify(graphData)), request.url, 'assets-cache')
      return new HTMLRewriter().on('head', new MetaTagInjector(graphData)).transform(res)
    }
  } catch (e) {
    return resPromise
  }
}
