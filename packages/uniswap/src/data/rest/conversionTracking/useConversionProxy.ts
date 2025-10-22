import type { PartialMessage } from '@bufbuild/protobuf'
import { type ConnectError, type Transport } from '@connectrpc/connect'
import { useMutation } from '@connectrpc/connect-query'
import { type UseMutationResult } from '@tanstack/react-query'
import { ConversionTrackingApi, createConnectTransportWithDefaults } from '@universe/api'
import { getConversionProxyApiBaseUrl } from 'uniswap/src/data/rest/conversionTracking/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

const createConversionProxyTransport = (isConversionApiMigrationEnabled: boolean): Transport =>
  createConnectTransportWithDefaults({
    baseUrl: getConversionProxyApiBaseUrl(isConversionApiMigrationEnabled),
  })

export function useConversionProxy(): UseMutationResult<
  ConversionTrackingApi.ProxyResponse,
  ConnectError,
  PartialMessage<ConversionTrackingApi.ProxyRequest>
> {
  const isConversionApiMigrationEnabled = useFeatureFlag(FeatureFlags.ConversionApiMigration)
  return useMutation(ConversionTrackingApi.proxy, {
    transport: createConversionProxyTransport(isConversionApiMigrationEnabled),
  })
}
