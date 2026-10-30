import { TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { CustomRankingType, RankingType } from '@universe/api'
import { exploreOrderByFromCategoryDefaultSort } from 'src/features/explore/utils'

describe(exploreOrderByFromCategoryDefaultSort, () => {
  it('maps a 1D price change default sort to the matching direction', () => {
    expect(exploreOrderByFromCategoryDefaultSort({ orderBy: TokensOrderBy.PRICE_CHANGE_1D, ascending: false })).toBe(
      CustomRankingType.PricePercentChange1DayDesc,
    )
    expect(exploreOrderByFromCategoryDefaultSort({ orderBy: TokensOrderBy.PRICE_CHANGE_1D, ascending: true })).toBe(
      CustomRankingType.PricePercentChange1DayAsc,
    )
  })

  it('maps a 1D volume default sort to volume', () => {
    expect(exploreOrderByFromCategoryDefaultSort({ orderBy: TokensOrderBy.VOLUME_1D, ascending: false })).toBe(
      RankingType.Volume,
    )
  })

  it('falls back to volume when unset or unmapped', () => {
    expect(exploreOrderByFromCategoryDefaultSort(undefined)).toBe(RankingType.Volume)
    expect(exploreOrderByFromCategoryDefaultSort({ orderBy: TokensOrderBy.FDV, ascending: false })).toBe(
      RankingType.Volume,
    )
  })
})
