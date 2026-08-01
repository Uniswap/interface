import { migration63 } from '~/state/migrations/63'

describe('migration63', () => {
  it('returns undefined when state is undefined', () => {
    expect(migration63(undefined)).toBeUndefined()
  })

  it('bumps the persisted version to 63 and removes hasDismissedUniswapWrapped2025Banner', () => {
    const previousState = {
      _persist: { version: 62, rehydrated: true },
      uniswapBehaviorHistory: {
        hasDismissedUniswapWrapped2025Banner: true,
        hasViewedBridgingBanner: true,
      },
    }
    const result: any = migration63(previousState as any)
    expect(result._persist.version).toBe(63)
    expect(result.uniswapBehaviorHistory).not.toHaveProperty('hasDismissedUniswapWrapped2025Banner')
    expect(result.uniswapBehaviorHistory.hasViewedBridgingBanner).toBe(true)
  })

  it('keeps state intact when uniswapBehaviorHistory is missing', () => {
    const previousState = {
      _persist: { version: 62, rehydrated: true },
      user: { something: true },
    }
    const result: any = migration63(previousState as any)
    expect(result._persist.version).toBe(63)
    expect(result.user).toEqual({ something: true })
  })
})
