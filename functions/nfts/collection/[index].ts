/* eslint-disable import/no-unused-modules */
import { MetaTagInjector } from '../../components/metaTagInjector'
import { getCache, putCache } from '../../utils/cache'
import getCollection from '../../utils/getCollection'

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const resPromise = next()
  const cachePromise = getCache(request.url, 'collections-cache')
  try {
    const [cacheResponse, res] = await Promise.all([cachePromise, resPromise])
    if (cacheResponse) {
      return new HTMLRewriter().on('head', new MetaTagInjector(cacheResponse)).transform(res)
    } else {
      const { index } = params
      const collectionAddress = index?.toString()
      const graphData = await getCollection(collectionAddress, request.url)
      if (!graphData) {
        return resPromise
      }
      await putCache(new Response(JSON.stringify(graphData)), request.url, 'collections-cache')
      return new HTMLRewriter().on('head', new MetaTagInjector(graphData)).transform(res)
    }
  } catch (e) {
    return resPromise
  }
}
