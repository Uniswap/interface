/* eslint-disable import/no-unused-modules */
import { MetaTagInjector } from '../../components/metaTagInjector'
import getAsset from '../../utils/getAsset'

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const { index } = params
  const collectionAddress = index[0]?.toString()
  const tokenId = index[1]?.toString()
  const assetPromise = getAsset(collectionAddress, tokenId, request.url)
  const resPromise = next()
  try {
    const cache = caches.default
    const response = await cache.match(request.url)
    if (response) {
      const data = JSON.parse(await response.text())
      return new HTMLRewriter().on('head', new MetaTagInjector(data)).transform(await resPromise)
    } else {
      const [data, res] = await Promise.all([assetPromise, resPromise])
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
