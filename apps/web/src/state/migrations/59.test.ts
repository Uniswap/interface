import { migration59 } from 'state/migrations/59'

const previousState = {
  _persist: {
    version: 58,
    rehydrated: true,
  },
  visibility: {
    tokens: {},
    positions: {},
    nfts: {},
  },
}

describe('migration to v59', () => {
  it('should properly set activity visibility state as empty and update persist version', async () => {
    const result = migration59(previousState)
    expect(result?._persist.version).toEqual(59)
    expect(result?.visibility.activity).toEqual({})
  })
})
