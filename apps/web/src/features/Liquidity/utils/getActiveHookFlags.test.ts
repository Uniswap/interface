import { HookFlags } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { describe, expect, it } from 'vitest'
import { getActiveHookFlags } from '~/features/Liquidity/utils/getActiveHookFlags'

describe('getActiveHookFlags', () => {
  it('returns empty array for undefined flags', () => {
    expect(getActiveHookFlags(undefined)).toEqual([])
  })

  it('returns empty array when no flags are set', () => {
    const flags = new HookFlags({})
    expect(getActiveHookFlags(flags)).toEqual([])
  })

  it('returns single active flag', () => {
    const flags = new HookFlags({ beforeSwap: true })
    expect(getActiveHookFlags(flags)).toEqual(['beforeSwap'])
  })

  it('returns multiple active flags in field order', () => {
    const flags = new HookFlags({
      beforeSwap: true,
      afterSwap: true,
      afterAddLiquidityReturnsDelta: true,
    })
    expect(getActiveHookFlags(flags)).toEqual(['beforeSwap', 'afterSwap', 'afterAddLiquidityReturnsDelta'])
  })

  it('excludes false flags', () => {
    const flags = new HookFlags({
      beforeInitialize: true,
      afterInitialize: false,
      beforeSwap: true,
      afterSwap: false,
    })
    expect(getActiveHookFlags(flags)).toEqual(['beforeInitialize', 'beforeSwap'])
  })
})
