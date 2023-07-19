/* eslint-disable import/no-unused-modules */
import { MetaTagInjector } from '../../components/metaTagInjector'
import getCollection from '../../utils/getCollection'

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const { index } = params
  const collectionAddress = index?.toString()
  const collectionPromise = getCollection(collectionAddress, request.url)
  const resPromise = next()
  try {
    const [data, res] = await Promise.all([collectionPromise, resPromise])
    if (!data) {
      return resPromise
    }
    return new HTMLRewriter().on('head', new MetaTagInjector(data)).transform(res)
  } catch (e) {
    return resPromise
  }
}
