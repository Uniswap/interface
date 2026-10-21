import { describe, expect, it } from 'vitest'
import { zoneMaxAlphaPct } from '~/pages/Swap/Margin/chart/PriceZonePrimitive'

describe('zoneMaxAlphaPct', () => {
  it('ramps 6% (no emphasis) → 14% (full emphasis) per spec F7', () => {
    expect(zoneMaxAlphaPct(0)).toBe(6)
    expect(zoneMaxAlphaPct(0.5)).toBe(10)
    expect(zoneMaxAlphaPct(1)).toBe(14)
  })
})
