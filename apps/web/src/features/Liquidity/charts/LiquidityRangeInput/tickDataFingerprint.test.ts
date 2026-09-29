import JSBI from 'jsbi'
import { getTickDataFingerprint } from '~/features/Liquidity/charts/LiquidityRangeInput/tickDataFingerprint'
import type { TickProcessed } from '~/features/Liquidity/utils/computeSurroundingTicks'

function tick(tickIdx: number, liquidityNet: string): TickProcessed {
  return {
    tick: tickIdx,
    liquidityNet: JSBI.BigInt(liquidityNet),
    liquidityActive: JSBI.BigInt(0),
    price0: '0',
    sdkPrice: {} as TickProcessed['sdkPrice'],
  }
}

describe('getTickDataFingerprint', () => {
  it('is identical for equal tick sets built from fresh objects', () => {
    const a = [tick(-100, '5'), tick(0, '-5'), tick(60, '12345678901234567890')]
    const b = [tick(-100, '5'), tick(0, '-5'), tick(60, '12345678901234567890')]

    expect(getTickDataFingerprint(a)).toBe(getTickDataFingerprint(b))
  })

  it('changes when a liquidityNet changes', () => {
    const base = [tick(-100, '5'), tick(0, '-5')]
    const changed = [tick(-100, '5'), tick(0, '-6')]

    expect(getTickDataFingerprint(changed)).not.toBe(getTickDataFingerprint(base))
  })

  it('changes when a tick moves', () => {
    const base = [tick(-100, '5'), tick(0, '-5')]
    const moved = [tick(-100, '5'), tick(60, '-5')]

    expect(getTickDataFingerprint(moved)).not.toBe(getTickDataFingerprint(base))
  })

  // Entries are terminated, so digits can't migrate across an entry boundary between two sets.
  it('distinguishes sets whose concatenated digits would otherwise line up', () => {
    const a = [tick(1, '2'), tick(34, '5')]
    const b = [tick(1, '23'), tick(4, '5')]

    expect(getTickDataFingerprint(a)).not.toBe(getTickDataFingerprint(b))
  })

  it('changes when a tick is added, and carries the length', () => {
    const base = [tick(-100, '5'), tick(0, '-5')]
    const added = [...base, tick(120, '1')]

    expect(getTickDataFingerprint(added)).not.toBe(getTickDataFingerprint(base))
    expect(getTickDataFingerprint(added).startsWith('3:')).toBe(true)
    expect(getTickDataFingerprint([])).toBe(`0:${(0x811c9dc5).toString(16)}`)
  })
})
