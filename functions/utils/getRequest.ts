import { MetaTagInjector } from '../components/metaTagInjector'
import Cache from './cache'

export default async function getRequest(
  res: Promise<Response>,
  url: string,
  cacheName: string,
  graphFunction: Promise<
    | {
        title: string
        image: any
        url: string
      }
    | undefined
  >
) {
  try {
    const cachePromise = Cache.match(url, cacheName)
    const cacheResponse = await cachePromise
    if (cacheResponse) {
      return new HTMLRewriter().on('head', new MetaTagInjector(cacheResponse)).transform(await res)
    } else {
      const graphData = await graphFunction
      if (!graphData) {
        return res
      }
      await Cache.put(new Response(JSON.stringify(graphData)), url, cacheName)
      return new HTMLRewriter().on('head', new MetaTagInjector(graphData)).transform(await res)
    }
  } catch (e) {
    return res
  }
}
