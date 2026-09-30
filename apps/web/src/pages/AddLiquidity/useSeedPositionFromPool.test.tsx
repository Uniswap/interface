import { renderHook } from '@testing-library/react'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import type { PoolData } from '~/data/pools/poolData'
import type { PositionState } from '~/features/Liquidity/Create/types'
import { useSeedPositionFromPool } from '~/pages/AddLiquidity/useSeedPositionFromPool'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'

vi.mock('~/pages/CreatePosition/CreateLiquidityContextProvider', () => ({ useCreateLiquidityContext: vi.fn() }))

const HOOK = '0x1111111111111111111111111111111111110080'
const FEE = { feeAmount: 3000, tickSpacing: 60, isDynamic: false }
const OTHER_FEE = { feeAmount: 500, tickSpacing: 10, isDynamic: false }

const setPositionState = vi.fn()

function pool(overrides: Partial<PoolData> = {}): PoolData {
  return { idOrAddress: 'pool-1', hookAddress: HOOK, feeTier: FEE, ...overrides } as PoolData
}

function applyLastUpdate(state: Partial<PositionState>): PositionState {
  const update = setPositionState.mock.calls.at(-1)?.[0] as (state: PositionState) => PositionState
  return update(state as PositionState)
}

describe('useSeedPositionFromPool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCreateLiquidityContext).mockReturnValue({ setPositionState } as unknown as ReturnType<
      typeof useCreateLiquidityContext
    >)
  })

  it('does nothing until the pool has loaded', () => {
    renderHook(() => useSeedPositionFromPool(undefined))
    expect(setPositionState).not.toHaveBeenCalled()
  })

  it("brings the hook and fee in line with the pool's once it arrives", () => {
    const { rerender } = renderHook(({ poolData }) => useSeedPositionFromPool(poolData), {
      initialProps: { poolData: undefined as PoolData | undefined },
    })

    rerender({ poolData: pool() })

    const next = applyLastUpdate({ hook: undefined, fee: OTHER_FEE })
    expect(next.hook).toBe(HOOK)
    expect(next.fee).toEqual(FEE)
  })

  // A zero-address hook in state (a pool link wrote it) and the pool service's undefined mean the same thing.
  it('treats a zero-address hook in state as already matching a hookless pool', () => {
    renderHook(() => useSeedPositionFromPool(pool({ hookAddress: undefined })))
    const state = { hook: ZERO_ADDRESS, fee: { ...FEE } } as PositionState
    expect(applyLastUpdate(state)).toBe(state)
  })

  it('returns the same state when it already matches the pool, whatever the casing', () => {
    renderHook(() => useSeedPositionFromPool(pool()))
    const state = { hook: HOOK.toLowerCase(), fee: { ...FEE } } as PositionState
    expect(applyLastUpdate(state)).toBe(state)
  })

  // A refetch hands back a new object for the same pool; re-seeding then would undo an in-form edit.
  it('seeds once per pool', () => {
    const { rerender } = renderHook(({ poolData }) => useSeedPositionFromPool(poolData), {
      initialProps: { poolData: pool() },
    })
    expect(setPositionState).toHaveBeenCalledTimes(1)

    rerender({ poolData: pool() })
    expect(setPositionState).toHaveBeenCalledTimes(1)

    rerender({ poolData: pool({ idOrAddress: 'pool-2', hookAddress: undefined }) })
    expect(setPositionState).toHaveBeenCalledTimes(2)
  })
})
