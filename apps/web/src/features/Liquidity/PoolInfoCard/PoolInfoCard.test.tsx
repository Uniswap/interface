import { UniverseChainId } from '@universe/chains'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { v2TokenToCurrency } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { ExpandablePoolInfo, PoolInfoCard } from '~/features/Liquidity/PoolInfoCard/PoolInfoCard'
import { mocked } from '~/test-utils/mocked'
import { validParsedPoolToken0, validParsedPoolToken1, validPoolDataResponse } from '~/test-utils/pools/fixtures'
import { render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/tokens/useCurrencyInfo')>()),
  useCurrencyInfo: vi.fn(),
}))
vi.mock('~/features/Liquidity/charts/useLiquidityServicePoolPriceChartData', () => ({
  useLiquidityServicePoolPriceChartData: vi.fn().mockReturnValue({ entries: [], loading: true }),
}))
vi.mock('~/hooks/useAppHeaderHeight', () => ({
  useAppHeaderHeight: vi.fn().mockReturnValue(72),
}))

// The served pool is USDC (token0) / WETH (token1); the Add Liquidity flow displays that WETH leg as native ETH.
const poolData = validPoolDataResponse.data
const usdc = v2TokenToCurrency(poolData.token0)
const eth = nativeOnChain(UniverseChainId.Mainnet)

function renderedImageSources(container: HTMLElement): (string | null)[] {
  return Array.from(container.querySelectorAll('img')).map((img) => img.getAttribute('src'))
}

describe('PoolInfoCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Nothing resolves through the lookup, so any token logo on screen came from the served pool data.
    mocked(useCurrencyInfo).mockReturnValue(undefined)
  })

  it('renders the pair logo from the served pool tokens without looking them up', () => {
    const { container } = render(<PoolInfoCard poolData={poolData} />)

    expect(renderedImageSources(container)).toEqual(
      expect.arrayContaining([validParsedPoolToken0.logoUrl, validParsedPoolToken1.logoUrl]),
    )
    expect(useCurrencyInfo).toHaveBeenCalledWith(expect.any(String), { skip: true })
    expect(useCurrencyInfo).not.toHaveBeenCalledWith(expect.any(String), { skip: false })
  })

  it('matches served logos to display-order currencies by identity, not slot', () => {
    // The create flow can hand ExpandablePoolInfo the pool's token1 in the first slot.
    const { container } = render(
      <ExpandablePoolInfo currency0={v2TokenToCurrency(poolData.token1)} currency1={undefined} poolData={poolData} />,
    )

    const sources = renderedImageSources(container)
    expect(sources).toContain(validParsedPoolToken1.logoUrl)
    expect(sources).not.toContain(validParsedPoolToken0.logoUrl)
  })

  it('labels the pair and the current price with the currencies the flow passes in', () => {
    render(<PoolInfoCard poolData={poolData} currency0={usdc} currency1={eth} />)

    expect(screen.getByText('USDC / ETH')).toBeInTheDocument()
    expect(screen.getByText(/^[^A-Z]+ USDC \/ ETH$/)).toBeInTheDocument()
    expect(screen.queryByText(/WETH/)).toBeNull()
  })

  it('falls back to the served tokens when no currencies are passed', () => {
    render(<PoolInfoCard poolData={poolData} />)

    expect(screen.getByText('USDC / WETH')).toBeInTheDocument()
    expect(screen.getByText(/^[^A-Z]+ USDC \/ WETH$/)).toBeInTheDocument()
  })

  it('denominates the current price in the currencies ExpandablePoolInfo is given', () => {
    render(<ExpandablePoolInfo currency0={usdc} currency1={eth} poolData={poolData} />)

    expect(screen.getByText(/^[^A-Z]+ USDC \/ ETH$/)).toBeInTheDocument()
  })

  it('keeps the current price in pool order when the pair arrives reversed', () => {
    // The price is token1 per token0 (USDC per WETH here), whatever order the caller labels the pair in.
    render(<ExpandablePoolInfo currency0={eth} currency1={usdc} poolData={poolData} />)

    expect(screen.getByText(/^[^A-Z]+ USDC \/ ETH$/)).toBeInTheDocument()
    expect(screen.queryByText(/ETH \/ USDC/)).toBeNull()
  })

  it('ignores a half-passed pair rather than mixing display and served labels', () => {
    render(<PoolInfoCard poolData={poolData} currency0={usdc} />)

    expect(screen.getByText('USDC / WETH')).toBeInTheDocument()
    expect(screen.getByText(/^[^A-Z]+ USDC \/ WETH$/)).toBeInTheDocument()
  })
})
