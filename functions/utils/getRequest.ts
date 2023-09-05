import { MetaTagInjector } from '../components/metaTagInjector'
import Cache from './cache'
import { Data } from './cache'

export async function getMetadataRequest(
  res: Promise<Response>,
  url: string,
  getData: () => Promise<Data | undefined>
) {
  try {
    const cachedData = await getRequest(url, getData, (data): data is Data => true)
    if (cachedData) {
      return new HTMLRewriter().on('head', new MetaTagInjector(cachedData)).transform(await res)
    } else {
      return res
    }
  } catch (e) {
    return res
  }
}

export async function getRequest<T extends Data>(
  url: string,
  getData: () => Promise<T | undefined>,
  validateData: (data: Data) => data is T
): Promise<T | undefined> {
  try {
    const cachedData = await Cache.match(url)
    if (cachedData && validateData(cachedData)) {
      return cachedData
    } else {
      const data = await getData()
      if (!data) {
        return undefined
      }
      await Cache.put(data, url)
      return data
    }
  } catch (e) {
    return undefined
  }
}
