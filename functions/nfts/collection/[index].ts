/* eslint-disable import/no-unused-modules */
import { MetaTagInjector } from '../../components/metaTagInjector'
import getCollection from '../../utils/getCollection'
import { getCache, putCache } from '../../utils/useCache'

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const { index } = params
  const collectionAddress = index?.toString()
  const collectionPromise = getCollection(collectionAddress, request.url)
  const resPromise = next()
  const cachePromise = getCache(request.url, 'collections-cache')
  try {
    const [graphData, cacheResponse, res] = await Promise.all([collectionPromise, cachePromise, resPromise])
    if (cacheResponse) {
      return new HTMLRewriter().on('head', new MetaTagInjector(cacheResponse)).transform(res)
    } else {
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
