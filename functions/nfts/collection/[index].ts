/* eslint-disable import/no-unused-modules */
import { MetaTagInjector } from '../../components/metaTagInjector'
import getCollection from '../../utils/getCollection'

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const { index } = params
  const collectionAddress = index?.toString()
  const collectionPromise = getCollection(collectionAddress, request.url)
  const resPromise = next()
  try {
    const cache = await caches.open('collections-cache')
    const response = await cache.match(request.url)
    if (response) {
      const data = JSON.parse(await response.text())
      return new HTMLRewriter().on('head', new MetaTagInjector(data)).transform(await resPromise)
    } else {
      const [data, res] = await Promise.all([collectionPromise, resPromise])
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
