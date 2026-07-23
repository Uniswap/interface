import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export const EARN_QUOTE_REFRESH_RETRY_QUERY_KEY = [ReactQueryCacheKey.TradeService, 'getTrade'] as const

export async function invalidateEarnQuoteRefreshQueries(
  queryClient: Pick<QueryClient, 'invalidateQueries'>,
): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: EARN_QUOTE_REFRESH_RETRY_QUERY_KEY })
}
