import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import {
  DEFAULT_DEPOSIT_STATE,
  DEFAULT_PRICE_RANGE_STATE,
  useCreateLiquidityContext,
} from '~/features/Liquidity/Create/CreateLiquidityContextProvider'
import type { PriceRangeState } from '~/features/Liquidity/Create/types'
import {
  PdpFlowActivityProvider,
  usePdpFlowActivity,
} from '~/pages/PoolDetails/components/LiquidityPanel/PdpFlowActivityContext'
import { useDefaultPriceRange } from '~/pages/PoolDetails/components/LiquidityPanel/useDefaultPriceRange'
import type { DepositState } from '~/types/liquidity'
import { PositionField } from '~/types/position'

vi.mock('~/features/Liquidity/Create/CreateLiquidityContextProvider', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/Liquidity/Create/CreateLiquidityContextProvider')>()),
  useCreateLiquidityContext: vi.fn(),
}))
vi.mock('~/pages/PoolDetails/components/LiquidityPanel/useDefaultPriceRange', () => ({ useDefaultPriceRange: vi.fn() }))

const DEFAULT_RANGE = { minTick: -600, maxTick: 600 }
const setDepositState = vi.fn()
const setPriceRangeState = vi.fn()

function mockFlow({
  priceRangeState = DEFAULT_PRICE_RANGE_STATE,
  depositState = DEFAULT_DEPOSIT_STATE,
}: {
  priceRangeState?: PriceRangeState
  depositState?: DepositState
} = {}) {
  vi.mocked(useCreateLiquidityContext).mockReturnValue({
    priceRangeState,
    setPriceRangeState,
    depositState,
    setDepositState,
  } as unknown as ReturnType<typeof useCreateLiquidityContext>)
}

function renderActivity() {
  return renderHook(() => usePdpFlowActivity(), {
    wrapper: ({ children }: { children?: ReactNode }) => <PdpFlowActivityProvider>{children}</PdpFlowActivityProvider>,
  })
}

/** What the last `setPriceRangeState` updater makes of `state`. */
function applyLastRangeUpdate(state: PriceRangeState): PriceRangeState {
  const update = setPriceRangeState.mock.calls.at(-1)?.[0] as (prev: PriceRangeState) => PriceRangeState
  return update(state)
}

describe('PdpFlowActivityProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setDepositState.mockReset()
    vi.mocked(useDefaultPriceRange).mockReturnValue(DEFAULT_RANGE)
    mockFlow()
  })

  it("seeds the pool's default range while the flow has none", () => {
    renderActivity()

    expect(applyLastRangeUpdate(DEFAULT_PRICE_RANGE_STATE)).toMatchObject(DEFAULT_RANGE)
  })

  it('leaves a range the flow already has', () => {
    mockFlow({ priceRangeState: { ...DEFAULT_PRICE_RANGE_STATE, minTick: -60, maxTick: 60 } })
    renderActivity()

    expect(setPriceRangeState).not.toHaveBeenCalled()
  })

  it('waits for the default range before seeding', () => {
    vi.mocked(useDefaultPriceRange).mockReturnValue(undefined)
    renderActivity()

    expect(setPriceRangeState).not.toHaveBeenCalled()
  })

  it('becomes active once an amount is typed', () => {
    mockFlow({
      priceRangeState: { ...DEFAULT_PRICE_RANGE_STATE, ...DEFAULT_RANGE },
      depositState: { exactField: PositionField.TOKEN0, exactAmounts: { [PositionField.TOKEN0]: '1' } },
    })
    const { result } = renderActivity()

    expect(result.current?.isActive).toBe(true)
  })

  it("exit clears the amounts and goes back to the pool's default range", () => {
    mockFlow({
      priceRangeState: { ...DEFAULT_PRICE_RANGE_STATE, fullRange: true },
      depositState: { exactField: PositionField.TOKEN0, exactAmounts: { [PositionField.TOKEN0]: '1' } },
    })
    // As the real flow would, the cleared deposit is what the next render reads.
    setDepositState.mockImplementation((depositState: DepositState) =>
      mockFlow({ priceRangeState: { ...DEFAULT_PRICE_RANGE_STATE, fullRange: true }, depositState }),
    )
    const { result } = renderActivity()

    act(() => result.current?.exit())

    expect(setDepositState).toHaveBeenCalledWith(DEFAULT_DEPOSIT_STATE)
    expect(applyLastRangeUpdate({ ...DEFAULT_PRICE_RANGE_STATE, fullRange: true })).toMatchObject({
      fullRange: false,
      ...DEFAULT_RANGE,
    })
    expect(result.current?.isActive).toBe(false)
  })
})
