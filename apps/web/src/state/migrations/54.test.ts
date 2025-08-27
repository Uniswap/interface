import { migration54 } from 'state/migrations/54'

const previousState = {
  _persist: {
    version: 53,
    rehydrated: true,
  },
  visibility: {
    tokens: {},
    positions: {},
  },
}

describe('migration to v54', () => {
  it('should properly set NFT visibility state as empty and update persist version', async () => {
    const result = migration54(previousState)
    expect(result?._persist.version).toEqual(54)
    expect(result?.visibility.nfts).toEqual({})
  })
})
