/* eslint-disable import/no-unused-modules */
import { MetaTagInjector } from '../components/metaTagInjector'
import { Data } from './cache'
import { getRequest } from './getRequest'

export async function transformResponse(
  request: Request,
  response: Response,
  data: (() => Promise<Data | undefined>) | Data | undefined
) {
  try {
    if (typeof data === 'function') {
      data = await getRequest(request.url, data, (data): data is Data => true)
    }
    if (data) {
      return new HTMLRewriter().on(MetaTagInjector.SELECTOR, new MetaTagInjector(data, request)).transform(response)
    } else {
      return response
    }
  } catch (e) {
    return response
  }
}
