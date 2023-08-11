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
    const cachedData = await Cache.match(url)
    if (cachedData) {
      return new HTMLRewriter().on('head', new MetaTagInjector(cachedData)).transform(await res)
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
