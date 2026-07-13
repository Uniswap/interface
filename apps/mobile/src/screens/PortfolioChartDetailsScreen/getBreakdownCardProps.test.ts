import { getBreakdownCardProps } from 'src/screens/PortfolioChartDetailsScreen/getBreakdownCardProps'
import { type PortfolioBalanceBreakdown } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'

const breakdown = (tokensUSD: number | undefined, poolsUSD: number | undefined): PortfolioBalanceBreakdown => ({
  total: { balanceUSD: (tokensUSD ?? 0) + (poolsUSD ?? 0), percentChange: 1, absoluteChangeUSD: 1 },
  tokens: { balanceUSD: tokensUSD, percentChange: -6.09, absoluteChangeUSD: -500 },
  pools: { balanceUSD: poolsUSD, percentChange: 1.02, absoluteChangeUSD: 70 },
  failedChainIds: [],
})

const NO_SCRUB = { total: undefined, tokens: undefined, pools: undefined }

const baseInput = {
  enabled: true,
  poolsUnavailable: false,
  breakdown: breakdown(8368, 7373),
  scrub: NO_SCRUB,
  tokensData: [
    { timestamp: 1, value: 100 },
    { timestamp: 2, value: 110 },
  ],
  poolsData: [
    { timestamp: 1, value: 200 },
    { timestamp: 2, value: 190 },
  ],
  isAllTimePeriod: false,
}

describe('getBreakdownCardProps', () => {
  it('hides the card when the flag is off', () => {
    expect(getBreakdownCardProps({ ...baseInput, enabled: false })).toBeUndefined()
  })

  it('hides the card when pools are unavailable', () => {
    expect(getBreakdownCardProps({ ...baseInput, poolsUnavailable: true })).toBeUndefined()
  })

  it('hides the card when there is no breakdown', () => {
    expect(getBreakdownCardProps({ ...baseInput, breakdown: undefined })).toBeUndefined()
  })

  it('hides the card when pools balance is zero', () => {
    expect(getBreakdownCardProps({ ...baseInput, breakdown: breakdown(8368, 0) })).toBeUndefined()
  })

  it('hides the card when tokens balance is zero', () => {
    expect(getBreakdownCardProps({ ...baseInput, breakdown: breakdown(0, 7373) })).toBeUndefined()
  })

  it('shows wallet-balance values with a period delta and neutral percent at rest', () => {
    const result = getBreakdownCardProps(baseInput)
    expect(result?.semanticPercentColor).toBe(false)
    expect(result?.tokens.valueUSD).toBe(8368)
    expect(result?.tokens.percentChange).toBeCloseTo(10) // series 100 -> 110
    expect(result?.pools.valueUSD).toBe(7373)
    expect(result?.pools.percentChange).toBeCloseTo(-5) // series 200 -> 190
  })

  it('omits the percent at rest on the all-time period', () => {
    const result = getBreakdownCardProps({ ...baseInput, isAllTimePeriod: true })
    expect(result?.tokens).toEqual({ valueUSD: 8368, percentChange: undefined })
    expect(result?.pools).toEqual({ valueUSD: 7373, percentChange: undefined })
  })

  it('shows scrubbed values with semantic color and a period-start delta while scrubbing', () => {
    const result = getBreakdownCardProps({
      ...baseInput,
      scrub: { total: 300, tokens: 110, pools: 190 },
    })
    expect(result?.semanticPercentColor).toBe(true)
    expect(result?.tokens.valueUSD).toBe(110)
    expect(result?.tokens.percentChange).toBeCloseTo(10) // 110 vs first 100
    expect(result?.pools.valueUSD).toBe(190)
    expect(result?.pools.percentChange).toBeCloseTo(-5) // 190 vs first 200
  })

  it('omits the percent while scrubbing on the all-time period', () => {
    const result = getBreakdownCardProps({
      ...baseInput,
      scrub: { total: 300, tokens: 110, pools: 190 },
      isAllTimePeriod: true,
    })
    expect(result?.tokens).toEqual({ valueUSD: 110, percentChange: undefined })
    expect(result?.pools).toEqual({ valueUSD: 190, percentChange: undefined })
  })
})
