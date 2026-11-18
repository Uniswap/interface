import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import type { UTCTimestamp } from 'lightweight-charts'
import { nativeOnChain, USDC } from 'uniswap/src/constants/tokens'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import { DefaultPriceStrategy } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { calculateStrategyTicks } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/priceStrategies'
import { useLiquidityServicePoolPriceChartData } from '~/features/Liquidity/charts/useLiquidityServicePoolPriceChartData'
import { useCreateLiquidityContext } from '~/features/Liquidity/Create/CreateLiquidityContextProvider'
import { useDefaultPriceRange } from '~/pages/PoolDetails/components/LiquidityPanel/useDefaultPriceRange'
import { renderHook } from '~/test-utils/render'

vi.mock('~/features/Liquidity/Create/CreateLiquidityContextProvider', () => ({ useCreateLiquidityContext: vi.fn() }))
vi.mock('~/features/Liquidity/charts/useLiquidityServicePoolPriceChartData', () => ({
  useLiquidityServicePoolPriceChartData: vi.fn(),
}))

const WETH = nativeOnChain(UniverseChainId.Mainnet).wrapped
// A USDC (6) / WETH (18) pool around 2,500 USDC per WETH: USDC is token0, priced in WETH.
const TICK_CURRENT = 198_000
const TICK_SPACING = 60
const CURRENT_PRICE = 0.0004

function flat(time: number, price: number): PriceChartData {
  return { time: time as UTCTimestamp, value: price, open: price, high: price, low: price, close: price }
}

function mockFlow({ protocolVersion = ProtocolVersion.V3 }: { protocolVersion?: ProtocolVersion } = {}) {
  vi.mocked(useCreateLiquidityContext).mockReturnValue({
    protocolVersion,
    poolId: '0xpool',
    poolOrPair: { tickCurrent: TICK_CURRENT, tickSpacing: TICK_SPACING },
    price: { toSignificant: () => String(CURRENT_PRICE) },
    currencies: { sdk: { TOKEN0: USDC, TOKEN1: WETH } },
    priceRangeState: { priceInverted: false },
  } as unknown as ReturnType<typeof useCreateLiquidityContext>)
}

function mockHistory({ entries, loading = false }: { entries: PriceChartData[]; loading?: boolean }) {
  vi.mocked(useLiquidityServicePoolPriceChartData).mockReturnValue({
    entries,
    loading,
  } as unknown as ReturnType<typeof useLiquidityServicePoolPriceChartData>)
}

const STABLE_RANGE = calculateStrategyTicks({
  priceStrategy: DefaultPriceStrategy.STABLE,
  currentTick: TICK_CURRENT,
  tickSpacing: TICK_SPACING,
})

describe('useDefaultPriceRange', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFlow()
  })

  it('takes the middle of the price history around the current price', () => {
    mockHistory({ entries: [flat(1, 0.00036), flat(2, 0.00044), flat(3, CURRENT_PRICE)] })
    const { result } = renderHook(() => useDefaultPriceRange())

    expect(result.current).toBeDefined()
    expect(result.current?.minTick).toBeLessThan(TICK_CURRENT)
    expect(result.current?.maxTick).toBeGreaterThan(TICK_CURRENT)
    expect(result.current).not.toEqual(STABLE_RANGE)
  })

  it('falls back to the stable preset when the history is too thin to define a range', () => {
    mockHistory({ entries: [] })
    const { result } = renderHook(() => useDefaultPriceRange())

    expect(result.current).toEqual(STABLE_RANGE)
  })

  it('waits for the history to load', () => {
    mockHistory({ entries: [], loading: true })
    const { result } = renderHook(() => useDefaultPriceRange())

    expect(result.current).toBeUndefined()
  })

  it('has no range for a v2 pair, which is always full range', () => {
    mockFlow({ protocolVersion: ProtocolVersion.V2 })
    mockHistory({ entries: [flat(1, CURRENT_PRICE)] })
    const { result } = renderHook(() => useDefaultPriceRange())

    expect(result.current).toBeUndefined()
  })
})
