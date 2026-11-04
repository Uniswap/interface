import { skipToken, type UseQueryResult } from '@tanstack/react-query'
import {
  V1_TRADING_API_PATHS,
  type TradingApi,
  type UseQueryWithImmediateGarbageCollectionApiHelperHookArgs,
  useQueryWithImmediateGarbageCollection,
} from '@universe/api'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useCheckApprovalQuery({
  params,
  ...rest
}: UseQueryWithImmediateGarbageCollectionApiHelperHookArgs<
  TradingApi.ApprovalRequest,
  TradingApi.ApprovalResponse
>): UseQueryResult<TradingApi.ApprovalResponse> {
  const queryKey = [ReactQueryCacheKey.TradingApi, V1_TRADING_API_PATHS.approval, getApprovalQueryKeyParams(params)]

  return useQueryWithImmediateGarbageCollection<TradingApi.ApprovalResponse>({
    queryKey,
    queryFn: params
      ? async (): ReturnType<typeof TradingApiClient.fetchCheckApproval> =>
          await TradingApiClient.fetchCheckApproval(params)
      : skipToken,
    ...rest,
  })
}

type ApprovalQueryKeyParams = Omit<TradingApi.ApprovalRequest, 'quote'> & {
  quote?: Pick<TradingApi.BridgeQuote, 'provider' | 'approvalSpender'>
}

/**
 * A bridge quote is new on every quote poll, but only its vendor and spender decide the approval. Keying on those
 * keeps the cached approval across polls, while a fetch still sends the latest quote.
 */
function getApprovalQueryKeyParams(params: TradingApi.ApprovalRequest | undefined): ApprovalQueryKeyParams | undefined {
  if (!params?.quote) {
    return params
  }
  const { quote, ...rest } = params
  return { ...rest, quote: { provider: quote.provider, approvalSpender: quote.approvalSpender } }
}
