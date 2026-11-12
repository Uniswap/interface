import type { MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { describe, expect, it } from 'vitest'
import { positionLeverage } from '~/features/margin/utils/marginAdjustPositionMath'

describe('positionLeverage', () => {
  // `Number('')` and `Number(null)` are both 0 AND finite, so a finiteness-only guard lets a blank wire
  // value masquerade as a genuinely debt-free position — which marginHealthFromLeverage then paints
  // healthy green. A real '0' still reads as 0; only the blanks become undefined.
  it.each(['', '   ', null, undefined])('reports nothing for a blank leverage (%o)', (leverage) => {
    expect(positionLeverage({ leverage } as unknown as MarginActivePosition)).toBeUndefined()
  })
  it('reads the wire field, already in exposure terms', () => {
    expect(positionLeverage({ leverage: '3' })).toBeCloseTo(3, 6)
  })

  it('is 0 for a short carrying nothing borrowed, not 1', () => {
    expect(positionLeverage({ leverage: '0' })).toBe(0)
  })

  it('is undefined when the server reports no finite leverage', () => {
    expect(positionLeverage({ leverage: undefined })).toBeUndefined()
  })
})
