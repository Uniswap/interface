import type { PartialMessage } from '@bufbuild/protobuf'
import { type ConnectError, type Transport } from '@connectrpc/connect'
import { useMutation } from '@connectrpc/connect-query'
import { type UseMutationResult } from '@tanstack/react-query'
import { ConversionTrackingApi, createConnectTransportWithDefaults } from '@universe/api'
import { getConversionProxyApiBaseUrl } from 'uniswap/src/data/rest/conversionTracking/utils'

const createConversionProxyTransport = (): Transport =>
  createConnectTransportWithDefaults({
    baseUrl: getConversionProxyApiBaseUrl(),
  })

export function useConversionProxy(): UseMutationResult<
  ConversionTrackingApi.ProxyResponse,
  ConnectError,
  PartialMessage<ConversionTrackingApi.ProxyRequest>
> {
  return useMutation(ConversionTrackingApi.proxy, {
    transport: createConversionProxyTransport(),
  })
}
