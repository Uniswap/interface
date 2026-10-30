import { GraphQLApi } from '@universe/api'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import {
  useTokenMarketStats,
  useTokenPriceConfidenceScore,
} from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
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
  useTokenPriceConfidenceScore: vi.fn(),
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
    mocked(useTokenPriceConfidenceScore).mockReturnValue(0.004)
  })

  it('fetches volume and TVL once open', () => {
    const { result } = renderData()

    expect(useTokenMarketStats).toHaveBeenLastCalledWith(
      currencyInfo.currencyId,
      expect.objectContaining({ skip: false, isMultichainAggregateView: false }),
    )
    expect(result.current).toEqual(
      expect.objectContaining({ volume24hUsd: 188_800, tvlUsd: 2_300_000, statsLoading: false }),
    )
  })

  it('holds the market stats query until the card is open', () => {
    renderData({ isOpen: false })

    expect(useTokenMarketStats).toHaveBeenLastCalledWith(
      currencyInfo.currencyId,
      expect.objectContaining({ skip: true }),
    )
  })

  it('reads the price confidence score once open', () => {
    const { result } = renderData()

    expect(useTokenPriceConfidenceScore).toHaveBeenLastCalledWith(
      currencyInfo.currencyId,
      expect.objectContaining({ skip: false, multichain: false }),
    )
    expect(result.current.priceConfidenceScore).toBe(0.004)
  })

  it('holds the price confidence query until the card is open', () => {
    renderData({ isOpen: false })

    expect(useTokenPriceConfidenceScore).toHaveBeenLastCalledWith(
      currencyInfo.currencyId,
      expect.objectContaining({ skip: true }),
    )
  })
})
