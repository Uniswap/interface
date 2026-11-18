import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import {
  DEFAULT_PRICE_RANGE_STATE,
  useCreateLiquidityContext,
} from '~/features/Liquidity/Create/CreateLiquidityContextProvider'
import type { PriceRangeState } from '~/features/Liquidity/Create/types'
import {
  PdpChartRangeProvider,
  usePdpChartRangeBand,
} from '~/pages/PoolDetails/components/LiquidityPanel/PdpChartRangeContext'
import { usePdpFlowActivity } from '~/pages/PoolDetails/components/LiquidityPanel/PdpFlowActivityContext'

vi.mock('~/features/Liquidity/Create/CreateLiquidityContextProvider', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/Liquidity/Create/CreateLiquidityContextProvider')>()),
  useCreateLiquidityContext: vi.fn(),
}))
vi.mock('~/pages/PoolDetails/components/LiquidityPanel/PdpFlowActivityContext', () => ({
  usePdpFlowActivity: vi.fn(),
}))

const SEEDED: PriceRangeState = { ...DEFAULT_PRICE_RANGE_STATE, minTick: -600, maxTick: 600 }

function mockFlow({
  priceRangeState = SEEDED,
  ticks = [-600, 600],
  hasTickSpacing = true,
  isActive = true,
}: {
  priceRangeState?: PriceRangeState
  ticks?: [number | undefined, number | undefined]
  hasTickSpacing?: boolean
  isActive?: boolean
} = {}) {
  vi.mocked(useCreateLiquidityContext).mockReturnValue({
    ticks,
    priceRangeState,
    poolOrPair: hasTickSpacing ? { tickSpacing: 60 } : undefined,
    currencies: { sdk: { TOKEN0: { decimals: 18 }, TOKEN1: { decimals: 18 } } },
  } as unknown as ReturnType<typeof useCreateLiquidityContext>)
  vi.mocked(usePdpFlowActivity).mockReturnValue({ isActive } as ReturnType<typeof usePdpFlowActivity>)
}

function renderBand() {
  return renderHook(() => usePdpChartRangeBand(false), {
    wrapper: ({ children }: { children?: ReactNode }) => <PdpChartRangeProvider>{children}</PdpChartRangeProvider>,
  }).result.current.rangeBand
}

describe('PdpChartRangeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('draws the flow’s range while a deposit is under way', () => {
    mockFlow()
    const band = renderBand()

    expect(band?.lower).toBeLessThan(1)
    expect(band?.upper).toBeGreaterThan(1)
  })

  it('draws nothing while the deposit flow is idle', () => {
    mockFlow({ isActive: false })

    expect(renderBand()).toBeUndefined()
  })

  it('draws nothing until the range is seeded', () => {
    mockFlow({ priceRangeState: DEFAULT_PRICE_RANGE_STATE })

    expect(renderBand()).toBeUndefined()
  })

  it('draws nothing for a pool without tick spacing (a v2 pair)', () => {
    mockFlow({ hasTickSpacing: false })

    expect(renderBand()).toBeUndefined()
  })

  it('draws a full range as the whole chart, with both edges open', () => {
    mockFlow({ priceRangeState: { ...SEEDED, fullRange: true } })

    const band = renderBand()

    expect(band).toBeDefined()
    expect(band?.lower).toBeUndefined()
    expect(band?.upper).toBeUndefined()
  })
})
