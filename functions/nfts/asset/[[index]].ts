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
  try {
    const response = await getCache(request.url, 'assets-cache')
    if (response) {
      return new HTMLRewriter().on('head', new MetaTagInjector(response)).transform(await resPromise)
    } else {
      const [data, res] = await Promise.all([assetPromise, resPromise])
      if (!data) {
        return resPromise
      }
      await putCache(new Response(JSON.stringify(data)), request.url, 'assets-cache')
      return new HTMLRewriter().on('head', new MetaTagInjector(data)).transform(res)
    }
  } catch (e) {
    return resPromise
  }
}
