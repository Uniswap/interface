import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { useTokenMarketStats } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { useTokenHoverCardData } from '~/components/HoverCard/TokenHoverCard/useTokenHoverCardData'
import { useTokenPriceChartData } from '~/hooks/useTokenPriceChartData'
import { mocked } from '~/test-utils/mocked'
import { renderHook } from '~/test-utils/render'

vi.mock('~/hooks/useTokenPriceChartData', () => ({
  useTokenPriceChartData: vi.fn(),
}))

vi.mock('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData', () => ({
  useTokenMarketStats: vi.fn(),
}))

const currencyInfo = buildCurrencyInfo({
  currency: USDC_MAINNET,
  currencyId: currencyId(USDC_MAINNET),
  logoUrl: null,
  isSpam: false,
})

function renderData({ isOpen = true }: { isOpen?: boolean } = {}) {
  return renderHook(() =>
    useTokenHoverCardData({
      currencyInfoProp: currencyInfo,
      gqlChain: GraphQLApi.Chain.Ethereum,
      rawAddress: USDC_MAINNET.address,
      hasOpenIntent: isOpen,
      isOpen,
    }),
  )
}

describe(useTokenHoverCardData, () => {
  beforeEach(() => {
    mocked(useTokenPriceChartData).mockReturnValue({ entries: [], loading: false } as never)
    mocked(useTokenMarketStats).mockReturnValue({ volume: 188_800, tvl: 2_300_000, isLoading: false } as never)
  })

  it('skips the market stats query and reports no stats while the search v2 UI flag is off', () => {
    mocked(useFeatureFlag).mockReturnValue(false)

    const { result } = renderData()

    expect(useTokenMarketStats).toHaveBeenLastCalledWith(
      currencyInfo.currencyId,
      expect.objectContaining({ skip: true }),
    )
    expect(result.current.statsEnabled).toBe(false)
  })

  it('fetches volume and TVL once open with the flag on', () => {
    mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.SearchV2UI)

    const { result } = renderData()

    expect(useTokenMarketStats).toHaveBeenLastCalledWith(
      currencyInfo.currencyId,
      expect.objectContaining({ skip: false, isMultichainAggregateView: false }),
    )
    expect(result.current).toEqual(
      expect.objectContaining({ statsEnabled: true, volume24hUsd: 188_800, tvlUsd: 2_300_000, statsLoading: false }),
    )
  })

  it('holds the market stats query until the card is open', () => {
    mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.SearchV2UI)

    renderData({ isOpen: false })

    expect(useTokenMarketStats).toHaveBeenLastCalledWith(
      currencyInfo.currencyId,
      expect.objectContaining({ skip: true }),
    )
  })
})
