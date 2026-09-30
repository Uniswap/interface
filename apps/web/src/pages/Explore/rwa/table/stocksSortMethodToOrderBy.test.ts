import { TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { describe, expect, it } from 'vitest'
import { stocksSortMethodToOrderBy } from '~/pages/Explore/rwa/table/stocksSortMethodToOrderBy'
import { StocksSortMethod } from '~/pages/Explore/rwa/table/stocksTableSortStore'

describe('stocksSortMethodToOrderBy', () => {
  it.each([
    [StocksSortMethod.PRICE, TokensOrderBy.PRICE],
    [StocksSortMethod.HOUR_CHANGE, TokensOrderBy.PRICE_CHANGE_1H],
    [StocksSortMethod.DAY_CHANGE, TokensOrderBy.PRICE_CHANGE_1D],
    [StocksSortMethod.MARKET_CAP, TokensOrderBy.MARKET_CAP],
  ])('maps %s to a fixed ranking', (sortMethod, expected) => {
    expect(stocksSortMethodToOrderBy({ sortMethod, volumeOrderBy: TokensOrderBy.VOLUME_7D })).toBe(expected)
  })

  it('ranks the volume sort by the selected timeframe', () => {
    expect(
      stocksSortMethodToOrderBy({ sortMethod: StocksSortMethod.VOLUME, volumeOrderBy: TokensOrderBy.VOLUME_30D }),
    ).toBe(TokensOrderBy.VOLUME_30D)
  })
})
