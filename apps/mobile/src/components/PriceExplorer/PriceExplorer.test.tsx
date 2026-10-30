import { TestID } from '@universe/test'
import { Text } from 'react-native'
import { PriceExplorer } from 'src/components/PriceExplorer/PriceExplorer'
import { useLineChartPrice } from 'src/components/PriceExplorer/usePrice'
import { useTokenPriceHistory } from 'src/components/PriceExplorer/usePriceHistory'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { render, screen } from 'src/test/test-utils'
import { useTokenPriceConfidenceScore } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'

const CURRENCY_ID = '1-0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'

vi.mock('src/components/TokenDetails/TokenDetailsContext', () => ({ useTokenDetailsContext: vi.fn() }))
vi.mock('src/utils/useIsScreenNavigationReady', () => ({ useIsScreenNavigationReady: () => true }))
vi.mock('src/components/PriceExplorer/usePriceHistory', () => ({ useTokenPriceHistory: vi.fn() }))
vi.mock('src/components/PriceExplorer/usePrice', () => ({ useLineChartPrice: vi.fn() }))
vi.mock('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData', () => ({
  useTokenPriceConfidenceScore: vi.fn(),
}))
// The change and date rows read the chart context; they're outside what this file covers.
vi.mock('src/components/PriceExplorer/Text', () => ({
  RelativeChangeText: () => null,
  DatetimeText: () => null,
}))
vi.mock('uniswap/src/features/prices/LowPriceConfidenceTag', () => ({
  LowPriceConfidenceTag: () => <Text testID={TestID.LowPriceConfidenceTag}>low confidence</Text>,
}))

function mockPrice({ isScrubbing = false }: { isScrubbing?: boolean } = {}): void {
  vi.mocked(useLineChartPrice).mockReturnValue({
    value: { value: 1 },
    formatted: { value: '$1.00' },
    shouldAnimate: { value: !isScrubbing },
  } as unknown as ReturnType<typeof useLineChartPrice>)
}

function mockPriceHistory({ isLoading = false }: { isLoading?: boolean } = {}): void {
  vi.mocked(useTokenPriceHistory).mockReturnValue({
    data: {
      priceHistory: [],
      spot: { value: { value: 1 }, relativeChange: { value: 0.5 }, relativeChangeIdle: 0.5 },
    },
    isLoading,
    setDuration: vi.fn(),
    selectedDuration: HistoryDuration.Day,
  } as unknown as ReturnType<typeof useTokenPriceHistory>)
}

describe('PriceExplorer', () => {
  beforeEach(() => {
    vi.mocked(useTokenDetailsContext).mockReturnValue({
      currencyId: CURRENCY_ID,
      tokenColor: null,
      navigation: {},
      initialIsMultichainAsset: false,
      hasMultichainAddresses: false,
    } as unknown as ReturnType<typeof useTokenDetailsContext>)
    mockPrice()
    mockPriceHistory()
    vi.mocked(useTokenPriceConfidenceScore).mockReturnValue(undefined)
  })

  it('shows the low confidence tag when the displayed price has a low confidence score', () => {
    vi.mocked(useTokenPriceConfidenceScore).mockReturnValue(0.001)

    render(<PriceExplorer />)

    expect(screen.getByTestId(TestID.LowPriceConfidenceTag)).toBeTruthy()
  })

  it.each([
    ['confident', 0.9],
    ['unscored', undefined],
  ])('does not show the low confidence tag when the price is %s', (_, score) => {
    vi.mocked(useTokenPriceConfidenceScore).mockReturnValue(score)

    render(<PriceExplorer />)

    expect(screen.queryByTestId(TestID.LowPriceConfidenceTag)).toBeNull()
  })

  it('hides the low confidence tag while scrubbing the chart', () => {
    vi.mocked(useTokenPriceConfidenceScore).mockReturnValue(0.001)
    mockPrice({ isScrubbing: true })

    render(<PriceExplorer />)

    expect(screen.queryByTestId(TestID.LowPriceConfidenceTag)).toBeNull()
  })

  it('hides the low confidence tag while the price is loading', () => {
    vi.mocked(useTokenPriceConfidenceScore).mockReturnValue(0.001)
    mockPriceHistory({ isLoading: true })

    render(<PriceExplorer />)

    expect(screen.queryByTestId(TestID.LowPriceConfidenceTag)).toBeNull()
  })

  it.each([
    ['single-chain', false],
    ['multichain aggregate', true],
  ])('reads the confidence score of the %s price it displays', (_, isMultichain) => {
    vi.mocked(useTokenDetailsContext).mockReturnValue({
      currencyId: CURRENCY_ID,
      tokenColor: null,
      navigation: {},
      initialIsMultichainAsset: isMultichain,
      hasMultichainAddresses: false,
    } as unknown as ReturnType<typeof useTokenDetailsContext>)

    render(<PriceExplorer />)

    expect(useTokenPriceConfidenceScore).toHaveBeenLastCalledWith(
      CURRENCY_ID,
      expect.objectContaining({ multichain: isMultichain, skip: false }),
    )
    expect(useTokenPriceHistory).toHaveBeenLastCalledWith(
      expect.objectContaining({ isMultichainAggregateView: isMultichain }),
    )
  })
})
