import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import { TokenDetailsMarketData } from 'src/components/TokenDetails/TokenDetailsStats/TokenDetailsMarketData'
import { fireEvent, render, screen } from 'src/test/test-utils'
import { useTokenMarketStats } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import type { MockedFunction } from 'vitest'

const ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: (props: { children: ReactNode }) => props.children,
}))

vi.mock('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData', () => ({
  useTokenMarketStats: vi.fn(),
}))

vi.mock('src/components/TokenDetails/TokenDetailsContext', () => ({
  useTokenDetailsContext: () => ({
    address: ADDRESS,
    chainId: UniverseChainId.Mainnet,
    currencyId: `1-${ADDRESS}`,
    currencyInfo: { currency: { symbol: 'FOO' } },
    tokenColor: null,
    multichainTokens: [],
    hasMultichainAddresses: false,
    initialIsMultichainAsset: false,
    openContractAddressExplainerModal: vi.fn(),
    openMultichainAddressSheet: vi.fn(),
    copyAddressToClipboard: vi.fn(),
  }),
}))

const mockUseTokenMarketStats = useTokenMarketStats as MockedFunction<typeof useTokenMarketStats>

const EMPTY_STATS = {
  marketCap: undefined,
  fdv: undefined,
  volume: undefined,
  high52w: undefined,
  low52w: undefined,
  tvl: undefined,
  poolsTvl: undefined,
  isLoading: false,
}

describe(TokenDetailsMarketData, () => {
  it('opens the token vs pool TVL breakdown when the TVL row is pressed', () => {
    mockUseTokenMarketStats.mockReturnValue({ ...EMPTY_STATS, tvl: 55_432, poolsTvl: 112_821 })

    render(<TokenDetailsMarketData />)

    expect(screen.queryByTestId(TestID.TokenDetailsStatsTvlBreakdown)).toBeNull()

    fireEvent.press(screen.getByTestId(TestID.TokenDetailsStatsTvl))

    expect(screen.getByTestId(TestID.TokenDetailsStatsTvlBreakdown)).toBeTruthy()
    expect(screen.getByText('$55,432')).toBeTruthy()
    expect(screen.getByText('$57,389')).toBeTruthy()
    expect(screen.getByText('$112,821')).toBeTruthy()
  })

  it('does not open the breakdown when pools TVL is missing', () => {
    mockUseTokenMarketStats.mockReturnValue({ ...EMPTY_STATS, tvl: 55_432 })

    render(<TokenDetailsMarketData />)

    fireEvent.press(screen.getByTestId(TestID.TokenDetailsStatsTvl))

    expect(screen.queryByTestId(TestID.TokenDetailsStatsTvlBreakdown)).toBeNull()
  })
})
