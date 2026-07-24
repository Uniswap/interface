import { renderHook } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { FeeAmount, TICK_SPACINGS, TickMath } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import JSBI from 'jsbi'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { USDT } from 'uniswap/src/constants/tokens'
import { useHookRejectsLiquidity } from '~/pages/CreatePosition/hooks/useHookRejectsLiquidity'
import { ETH_MAINNET } from '~/test-utils/constants'

// Real "bait" hook deployed on mainnet: its address flags include BeforeAddLiquidity (0x...a888 & 0x800).
const BAIT_HOOK_ADDRESS = '0xe288567d5eDa6f0FBe2A76A7b8CDf2040378a888'
// A hook with some flags set (BeforeSwap, 0x80) but NOT BeforeAddLiquidity.
const VANILLA_HOOK_ADDRESS = '0x0000000000000000000000000000000000000080'

// Mirrors the raw ConnectError message the trading API surfaces when a hook reverts the add.
const gasEstimationError = new Error(
  'ResourceNotFound: BadRequest: FAILED_TO_ESTIMATE_GAS:{"name":"FAILED_TO_ESTIMATE_GAS"}',
)
const poolRejectsLiquidityError = new Error('POOL_REJECTS_LIQUIDITY')
const unrelatedError = new Error('user rejected the transaction')

function buildV4Pool(hooks: string): V4Pool {
  const tick = -196257
  return new V4Pool(
    ETH_MAINNET,
    USDT,
    FeeAmount.MEDIUM,
    TICK_SPACINGS[FeeAmount.MEDIUM],
    hooks,
    TickMath.getSqrtRatioAtTick(tick),
    JSBI.BigInt(0),
    tick,
  )
}

type HookParams = Parameters<typeof useHookRejectsLiquidity>[0]

function renderUseHookRejectsLiquidity(overrides: Partial<HookParams> = {}): boolean {
  const params: HookParams = {
    createError: gasEstimationError,
    creatingPoolOrPair: false,
    protocolVersion: ProtocolVersion.V4,
    poolOrPair: buildV4Pool(BAIT_HOOK_ADDRESS),
    ...overrides,
  }
  const { result } = renderHook(() => useHookRejectsLiquidity(params))
  return result.current
}

describe('useHookRejectsLiquidity', () => {
  describe('returns true', () => {
    it('for an existing v4 pool whose hook has BeforeAddLiquidity and a gas-estimation create error', () => {
      expect(renderUseHookRejectsLiquidity()).toBe(true)
    })

    it('for the explicit POOL_REJECTS_LIQUIDITY backend reason', () => {
      expect(
        renderUseHookRejectsLiquidity({
          createError: poolRejectsLiquidityError,
        }),
      ).toBe(true)
    })

    it('when the pool object is not built yet but the hook address prop has the permission', () => {
      expect(
        renderUseHookRejectsLiquidity({
          poolOrPair: undefined,
          hook: BAIT_HOOK_ADDRESS,
        }),
      ).toBe(true)
    })
  })

  describe('returns false', () => {
    it('when the pool has no hook (zero address)', () => {
      expect(renderUseHookRejectsLiquidity({ poolOrPair: buildV4Pool(ZERO_ADDRESS) })).toBe(false)
    })

    it('when the hook lacks the BeforeAddLiquidity flag', () => {
      expect(
        renderUseHookRejectsLiquidity({
          poolOrPair: buildV4Pool(VANILLA_HOOK_ADDRESS),
        }),
      ).toBe(false)
      expect(
        renderUseHookRejectsLiquidity({
          poolOrPair: undefined,
          hook: VANILLA_HOOK_ADDRESS,
        }),
      ).toBe(false)
    })

    it('when there is no hook address at all', () => {
      expect(
        renderUseHookRejectsLiquidity({
          poolOrPair: undefined,
          hook: undefined,
        }),
      ).toBe(false)
    })

    it('when the user is creating a new pool rather than adding to an existing one', () => {
      expect(renderUseHookRejectsLiquidity({ creatingPoolOrPair: true })).toBe(false)
      expect(
        renderUseHookRejectsLiquidity({
          creatingPoolOrPair: true,
          poolOrPair: undefined,
          hook: BAIT_HOOK_ADDRESS,
        }),
      ).toBe(false)
    })

    it('when there is no create error', () => {
      expect(renderUseHookRejectsLiquidity({ createError: null })).toBe(false)
    })

    it('when the error is unrelated to the pool rejecting liquidity', () => {
      expect(renderUseHookRejectsLiquidity({ createError: unrelatedError })).toBe(false)
    })

    it('for non-v4 protocol versions', () => {
      expect(renderUseHookRejectsLiquidity({ protocolVersion: ProtocolVersion.V3 })).toBe(false)
    })
  })
})
