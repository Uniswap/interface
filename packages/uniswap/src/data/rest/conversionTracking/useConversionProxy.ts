import type { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError, Transport } from '@connectrpc/connect'
import { useMutation } from '@connectrpc/connect-query'
import { UseMutationResult } from '@tanstack/react-query'
import { createConnectTransportWithDefaults } from 'uniswap/src/data/rest/base'
import { proxy } from 'uniswap/src/data/rest/conversionTracking/api/api-ConversionProxyService_connectquery'
import { ProxyRequest, ProxyResponse } from 'uniswap/src/data/rest/conversionTracking/api/api_pb'
import { getConversionProxyApiBaseUrl } from 'uniswap/src/data/rest/conversionTracking/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

const createConversionProxyTransport = (isConversionApiMigrationEnabled: boolean): Transport =>
  createConnectTransportWithDefaults({
    baseUrl: getConversionProxyApiBaseUrl(isConversionApiMigrationEnabled),
  })

export function useConversionProxy(): UseMutationResult<ProxyResponse, ConnectError, PartialMessage<ProxyRequest>> {
  const isConversionApiMigrationEnabled = useFeatureFlag(FeatureFlags.ConversionApiMigration)
  return useMutation(proxy, { transport: createConversionProxyTransport(isConversionApiMigrationEnabled) })
}
