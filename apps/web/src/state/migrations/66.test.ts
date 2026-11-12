import { migration66 } from '~/state/migrations/66'

describe('migration66', () => {
  it('returns undefined when state is undefined', () => {
    expect(migration66(undefined)).toBeUndefined()
  })

  it('bumps the persisted version to 66 and seeds onboarding history from local swaps', () => {
    const previousState = {
      _persist: { version: 65, rehydrated: true },
      transactions: { '0xABC': { 1: { a: { id: 'a', status: 'confirmed', typeInfo: { type: 'swap' } } } } },
      uniswapBehaviorHistory: { hasViewedBridgingBanner: true },
    }
    const result: any = migration66(previousState as any)
    expect(result._persist.version).toBe(66)
    expect(result.uniswapBehaviorHistory).toEqual({
      hasViewedBridgingBanner: true,
      newUserOnboarding: { byWallet: { '0xabc': { hasCompletedSwap: true } } },
    })
  })
})
