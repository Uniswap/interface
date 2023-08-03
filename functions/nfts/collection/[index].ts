/* eslint-disable import/no-unused-modules */
import { MetaTagInjector } from '../../components/metaTagInjector'
import Cache from '../../utils/cache'
import getCollection from '../../utils/getCollection'

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const res = next()
  const cachePromise = Cache.match(request.url, 'collections-cache')
  try {
    const cacheResponse = await cachePromise
    if (cacheResponse) {
      return new HTMLRewriter().on('head', new MetaTagInjector(cacheResponse)).transform(await res)
    } else {
      const { index } = params
      const collectionAddress = index?.toString()
      const graphData = await getCollection(collectionAddress, request.url)
      if (!graphData) {
        return res
      }
      await Cache.put(new Response(JSON.stringify(graphData)), request.url, 'collections-cache')
      return new HTMLRewriter().on('head', new MetaTagInjector(graphData)).transform(await res)
    }
  } catch (e) {
    return res
  }
}
