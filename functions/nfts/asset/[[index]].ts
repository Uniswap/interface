/* eslint-disable import/no-unused-modules */
import getAsset from '../../utils/getAsset'
import { MetaTagInjector } from './assetInjector'

export const onRequest: PagesFunction<{}> = async ({ params, request, env, next }) => {
  try {
    const { index } = params
    const collectionAddress = String(index[0])
    const tokenId = String(index[1])
    const data = await getAsset(collectionAddress, tokenId, request.url)
    if (!data) {
      return await next()
    }
    return new HTMLRewriter().on('head', new MetaTagInjector(data)).transform(await next())
  } catch (e) {
    console.log(e)
    return await next()
  }
}
