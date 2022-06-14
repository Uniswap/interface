import { ClientSideOrderBy, CoingeckoMarketCoin } from 'src/features/dataApi/coingecko/types'
import { getCompareFn } from 'src/features/explore/utils'

const a: CoingeckoMarketCoin = {
  price_change_percentage_24h: 1,
} as unknown as CoingeckoMarketCoin
const b: CoingeckoMarketCoin = {
  price_change_percentage_24h: 2,
} as unknown as CoingeckoMarketCoin

describe(getCompareFn, () => {
  it('returns a comparator for client side order by', () => {
    const compareFn = getCompareFn(ClientSideOrderBy.PriceChangePercentage24hDesc)
    expect(compareFn(a, b)).toEqual(1)

    const compareFn2 = getCompareFn(ClientSideOrderBy.PriceChangePercentage24hAsc)
    expect(compareFn2(a, b)).toEqual(-1)
  })
})
