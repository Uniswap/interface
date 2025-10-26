import { type CustomOptions, type FetchClient } from '@universe/api/src/clients/base/types'

type TransformRequestResult = {
  url?: string
  headers?: HeadersInit
  params?: unknown
}

type TransformRequestInput<TRequest> = {
  url: string
  headers?: HeadersInit
  params: TRequest
}

export function createFetcher<TRequest, TResponse>(ctx: {
  client: FetchClient
  method: Extract<keyof FetchClient, 'get' | 'post' | 'put' | 'delete' | 'patch'>
  url: string
  transformRequest?: (request: TransformRequestInput<TRequest>) => Promise<TransformRequestResult>
  on404?: (params: TRequest) => void
}): (params: TRequest, customHeaders?: HeadersInit) => Promise<TResponse> {
  const { client, url, method, transformRequest, on404 } = ctx
  return async (params: TRequest, customHeaders?: HeadersInit): Promise<TResponse> => {
    const transformedRequest = transformRequest ? await transformRequest({ url, headers: customHeaders, params }) : {}
    const transformedUrl = transformedRequest.url ?? url
    const transformedHeaders = transformedRequest.headers ?? {}
    const transformedParams = transformedRequest.params ?? params

    if (method === 'get') {
      return client.get<TResponse>(transformedUrl, {
        headers: { ...customHeaders, ...transformedHeaders },
        params: transformedParams as CustomOptions['params'],
        on404: () => on404?.(params),
      })
    }
    return client[method]<TResponse>(transformedUrl, {
      headers: { ...customHeaders, ...transformedHeaders },
      body: JSON.stringify(transformedParams),
      on404: () => on404?.(params),
    })
  }
}

export const objectToQueryString = (obj: Record<string, string | number | boolean>): string => {
  return Object.entries(obj)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
}
