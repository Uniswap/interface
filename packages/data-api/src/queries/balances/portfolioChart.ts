import { type PartialMessage, type PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import type { GetPortfolioChartRequest, GetPortfolioChartResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { isRetryableSessionGateError } from '@universe/sessions'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { type DataApiServiceClient } from '../../clients/createDataApiServiceClient'
import {
  type AccountAddressesByPlatform,
  buildAccountAddressesByPlatform,
} from '../../utils/buildAccountAddressesByPlatform'
import { transformInput, type WithoutWalletAccount } from '../../utils/input'

// Each session wait can take 10 seconds, so retry only once.
const MAX_SESSION_GATE_RETRIES = 1

export type GetPortfolioChartInput = {
  input?: WithoutWalletAccount<PartialMessage<GetPortfolioChartRequest>> & {
    evmAddress?: string
    svmAddress?: string
  }
} & {
  enabled?: boolean
}

type GetPortfolioChartQueryKey = readonly [
  ReactQueryCacheKey.GetPortfolioChart,
  AccountAddressesByPlatform | undefined,
  Record<string, unknown>,
]

export function getPortfolioChartQueryOptions(
  client: DataApiServiceClient,
  { input, enabled = true }: GetPortfolioChartInput,
): QueryOptionsResult<
  PlainMessage<GetPortfolioChartResponse> | undefined,
  Error,
  PlainMessage<GetPortfolioChartResponse> | undefined,
  GetPortfolioChartQueryKey
> {
  const accountAddressesByPlatform = buildAccountAddressesByPlatform(input)
  const transformedInput = transformInput(input)

  const { walletAccount: _walletAccount, ...inputWithoutWalletAccount } = transformedInput ?? {}

  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.GetPortfolioChart, accountAddressesByPlatform, inputWithoutWalletAccount] as const,
    // toPlainMessage strips the Message prototype so the value survives disk persistence.
    queryFn: async (): Promise<PlainMessage<GetPortfolioChartResponse> | undefined> => {
      if (!transformedInput) {
        return Promise.resolve(undefined)
      }

      return toPlainMessage(await client.getPortfolioChart(transformedInput))
    },
    enabled: !!transformedInput && enabled,
    placeholderData: (prev) => prev,
    staleTime: ONE_MINUTE_MS,
    retry: (failureCount, error) => failureCount < MAX_SESSION_GATE_RETRIES && isRetryableSessionGateError(error),
  })
}
