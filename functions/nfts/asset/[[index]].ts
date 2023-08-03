/* eslint-disable import/no-unused-modules */
import { MetaTagInjector } from '../../components/metaTagInjector'
import Cache from '../../utils/cache'
import getAsset from '../../utils/getAsset'

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const res = next()
  const cachePromise = Cache.match(request.url, 'assets-cache')
  try {
    const cacheResponse = await cachePromise
    if (cacheResponse) {
      return new HTMLRewriter().on('head', new MetaTagInjector(cacheResponse)).transform(await res)
    } else {
      const { index } = params
      const collectionAddress = index[0]?.toString()
      const tokenId = index[1]?.toString()
      const graphData = await getAsset(collectionAddress, tokenId, request.url)
      if (!graphData) {
        return res
      }
      await Cache.put(new Response(JSON.stringify(graphData)), request.url, 'assets-cache')
      return new HTMLRewriter().on('head', new MetaTagInjector(graphData)).transform(await res)
    }
  } catch (e) {
    return res
  }
}
