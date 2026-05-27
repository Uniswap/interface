import { migration62 } from '~/state/migrations/62'

describe('migration62', () => {
  it('returns undefined when state is undefined', () => {
    expect(migration62(undefined)).toBeUndefined()
  })

  it('bumps the persisted version to 62 and initializes enableCustomGasFeeEntry', () => {
    const previousState = {
      _persist: { version: 61, rehydrated: true },
      userSettings: { hideSmallBalances: true },
    }
    const result: any = migration62(previousState as any)
    expect(result._persist.version).toBe(62)
    expect(result.userSettings.enableCustomGasFeeEntry).toBe(false)
    expect(result.userSettings.hideSmallBalances).toBe(true)
  })
})
