import { type StreamResponse, type Transport, type UnaryResponse } from '@connectrpc/connect'
import { type ConnectTransportOptions, createConnectTransport } from '@connectrpc/connect-web'

// The string arg to pass to the BE for chainId to get data for all networks
export const ALL_NETWORKS_ARG = 'ALL_NETWORKS'

export interface ConnectRpcContext {
  baseUrl: string
  additionalHeaders?: HeadersInit
}

export const createConnectTransportWithDefaults = (
  context: ConnectRpcContext,
  transportOptions: Partial<ConnectTransportOptions> = {},
): Transport =>
  createConnectTransport({
    baseUrl: context.baseUrl,
    interceptors: context.additionalHeaders
      ? [
          (next) =>
            (request): Promise<UnaryResponse | StreamResponse> => {
              if (context.additionalHeaders) {
                const headers = new Headers(context.additionalHeaders)
                headers.forEach((value, key) => {
                  request.header.set(key, value)
                })
              }
              return next(request)
            },
        ]
      : [],
    ...transportOptions,
  })
