/* eslint-disable import/no-unused-modules */
import getCollection from '../../utils/getCollection'
import { MetaTagInjector } from '../../components/collectionInjector'

export const onRequest: PagesFunction<{}> = async ({ params, request, env, next }) => {
  try {
    const { index } = params
    const collectionAddress = String(index)
    const data = await getCollection(collectionAddress, request.url)
    if (!data) {
      return await next()
    }
    return new HTMLRewriter().on('head', new MetaTagInjector(data)).transform(await next())
  } catch (e) {
    console.log(e)
    return await next()
  }
}
