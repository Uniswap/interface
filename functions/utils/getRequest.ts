import { MetaTagInjector } from '../components/metaTagInjector'
import Cache from './cache'

export default async function getRequest(
  res: Promise<Response>,
  url: string,
  getData: () => Promise<
    | {
        title: string
        image: string
        url: string
      }
    | undefined
  >
) {
  try {
    const cacheResponse = await Cache.match(url)
    if (cacheResponse) {
      return new HTMLRewriter().on('head', new MetaTagInjector(cacheResponse)).transform(await res)
    } else {
      const data = await getData()
      if (!data) {
        return res
      }
      await Cache.put(data, url)
      return new HTMLRewriter().on('head', new MetaTagInjector(data)).transform(await res)
    }
  } catch (e) {
    return res
  }
}
