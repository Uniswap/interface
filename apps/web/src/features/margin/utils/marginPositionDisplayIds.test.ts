import type { MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { describe, expect, it } from 'vitest'
import { marginPositionDisplayIds } from '~/features/margin/utils/marginPositionDisplayIds'

// Only the fields the ordinals read.
const position = (positionId: string, openedAt: string): MarginActivePosition =>
  ({ positionId, openedAt }) as unknown as MarginActivePosition

describe(marginPositionDisplayIds, () => {
  it('numbers every position once, oldest first, unparseable opens last, ties by id', () => {
    const ids = marginPositionDisplayIds([
      position('c', 'bad'),
      position('b', '200'),
      position('a', '200'),
      position('d', '100'),
    ])
    expect(Object.fromEntries(ids)).toEqual({ d: 1, a: 2, b: 3, c: 4 })
  })
})
