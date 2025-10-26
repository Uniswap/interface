import { migration49 } from 'state/migrations/49'

describe('migration49', () => {
  it('should remove localWebTransactions from state', () => {
    const stateWithLocalWebTransactions = {
      _persist: {
        version: 48,
        rehydrated: true,
      },
      localWebTransactions: {
        '0x123': {
          hash: '0xabc',
          status: 'pending',
        },
      },
      otherData: 'should remain',
    }

    const result = migration49(stateWithLocalWebTransactions)

    expect(result).toEqual({
      _persist: {
        version: 49,
        rehydrated: true,
      },
      otherData: 'should remain',
    })
    expect((result as any)?.localWebTransactions).toBeUndefined()
  })

  it('should update persist version', () => {
    const state = {
      _persist: {
        version: 48,
        rehydrated: true,
      },
      localWebTransactions: { someData: 'test' },
    }

    const result = migration49(state)

    expect(result?._persist.version).toBe(49)
  })

  it('should handle state without localWebTransactions', () => {
    const state = {
      _persist: {
        version: 48,
        rehydrated: true,
      },
      otherData: 'should remain',
    }

    const result = migration49(state)

    expect(result).toEqual({
      _persist: {
        version: 49,
        rehydrated: true,
      },
      otherData: 'should remain',
    })
  })

  it('should handle undefined state', () => {
    const result = migration49(undefined)
    expect(result).toBeUndefined()
  })
})
