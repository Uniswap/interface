import { migration56 } from 'state/migrations/56'

const previousState = {
  _persist: {
    version: 55,
    rehydrated: true,
  },
  signatures: {
    someData: 'test',
    nestedData: {
      field: 'value',
    },
  },
}

describe('migration to v56', () => {
  it('should remove signatures field and update persist version', () => {
    const result = migration56(previousState)
    expect(result?._persist.version).toEqual(56)
    expect('signatures' in (result ?? {})).toBe(false)
  })
})
