/* eslint-disable import/no-unused-modules */
import { MetaTagInjector } from '../../components/metaTagInjector'
import getCollection from '../../utils/getCollection'
import { getCache, putCache } from '../../utils/useCache'

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const { index } = params
  const collectionAddress = index?.toString()
  const collectionPromise = getCollection(collectionAddress, request.url)
  const resPromise = next()
  try {
    const response = await getCache(request.url, 'collections-cache')
    if (response) {
      return new HTMLRewriter().on('head', new MetaTagInjector(response)).transform(await resPromise)
    } else {
      const [data, res] = await Promise.all([collectionPromise, resPromise])
      if (!data) {
        return resPromise
      }
      await putCache(new Response(JSON.stringify(data)), request.url, 'collections-cache')
      return new HTMLRewriter().on('head', new MetaTagInjector(data)).transform(res)
    }
  } catch (e) {
    return resPromise
  }
}
