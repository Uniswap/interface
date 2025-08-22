import { MetaTagInjector } from '../components/metaTagInjector'
import { Data } from './cache'
import { getRequest } from './getRequest'

export async function transformResponse({
  request,
  response,
  data,
}: {
  request: Request
  response: Response
  data?: (() => Promise<Data | undefined>) | Data
}) {
  try {
    if (typeof data === 'function') {
      data = await getRequest({
        url: request.url,
        getData: data,
        validateData: (data): data is Data => true,
      })
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
