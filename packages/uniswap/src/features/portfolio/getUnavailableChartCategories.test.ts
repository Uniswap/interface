import { WalletBalanceCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { getUnavailableChartCategories } from 'uniswap/src/features/portfolio/getUnavailableChartCategories'

const point = (value: number): { timestamp: bigint; value: number } => ({ timestamp: BigInt(1), value })
const BOTH = [WalletBalanceCategory.POOLS, WalletBalanceCategory.EARN_VAULTS]

describe('getUnavailableChartCategories', () => {
  it('returns nothing when every requested category has a series', () => {
    expect(
      getUnavailableChartCategories({
        chartData: { tokens: [point(1)], pools: [point(2)], earn: [point(3)] },
        requestedCategories: BOTH,
      }),
    ).toEqual([])
  })

  it('treats an all-zero series as available', () => {
    expect(
      getUnavailableChartCategories({
        chartData: { tokens: [point(1)], pools: [point(0)], earn: [point(0)] },
        requestedCategories: BOTH,
      }),
    ).toEqual([])
  })

  it('returns each requested category the response left empty', () => {
    expect(
      getUnavailableChartCategories({
        chartData: { tokens: [point(1)], pools: [], earn: [] },
        requestedCategories: BOTH,
      }),
    ).toEqual(BOTH)
  })

  it('treats a field the response omitted as empty', () => {
    expect(getUnavailableChartCategories({ chartData: { tokens: [point(1)] }, requestedCategories: BOTH })).toEqual(
      BOTH,
    )
  })

  it('ignores a category that was not requested', () => {
    expect(
      getUnavailableChartCategories({
        chartData: { tokens: [point(1)], pools: [], earn: [point(3)] },
        requestedCategories: [WalletBalanceCategory.EARN_VAULTS],
      }),
    ).toEqual([])
  })

  it('returns nothing for an empty wallet with no tokens series', () => {
    expect(
      getUnavailableChartCategories({
        chartData: { tokens: [], pools: [], earn: [] },
        requestedCategories: BOTH,
      }),
    ).toEqual([])
  })

  it('returns nothing before the chart has loaded', () => {
    expect(getUnavailableChartCategories({ chartData: undefined, requestedCategories: BOTH })).toEqual([])
  })
})
