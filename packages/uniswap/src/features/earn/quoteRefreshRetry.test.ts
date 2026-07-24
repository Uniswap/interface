import {
  EARN_QUOTE_REFRESH_RETRY_QUERY_KEY,
  invalidateEarnQuoteRefreshQueries,
} from 'uniswap/src/features/earn/quoteRefreshRetry'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

describe('invalidateEarnQuoteRefreshQueries', () => {
  it('invalidates the active TradeService quote query family', async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined)

    await invalidateEarnQuoteRefreshQueries({ invalidateQueries })

    expect(EARN_QUOTE_REFRESH_RETRY_QUERY_KEY).toEqual([ReactQueryCacheKey.TradeService, 'getTrade'])
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: [ReactQueryCacheKey.TradeService, 'getTrade'] })
  })
})
