import { createMigrate } from 'redux-persist'
import { migration1 } from 'state/migrations/1'
import { migration2 } from 'state/migrations/2'
import { migration3 } from 'state/migrations/3'
import { migration4 } from 'state/migrations/4'
import { migration5 } from 'state/migrations/5'
import { migration6 } from 'state/migrations/6'
import { migration7 } from 'state/migrations/7'
import { migration8 } from 'state/migrations/8'
import { migration9, PersistAppStateV9 } from 'state/migrations/9'

const COINGECKO_AVAX_LIST = 'https://tokens.coingecko.com/avalanche/all.json'

const previousState: PersistAppStateV9 = {
  lists: {
    byUrl: {
      [COINGECKO_AVAX_LIST]: {
        current: {
          name: COINGECKO_AVAX_LIST,
          timestamp: '123456789',
          tokens: [],
          version: {
            major: 1,
            minor: 0,
            patch: 0,
          },
        },
        pendingUpdate: null,
        loadingRequestId: null,
        error: null,
      },
      randomURL: {
        current: {
          name: 'random',
          timestamp: '123456789',
          tokens: [],
          version: {
            major: 1,
            minor: 0,
            patch: 0,
          },
        },
        pendingUpdate: null,
        loadingRequestId: null,
        error: null,
      },
    },
  },
  _persist: {
    version: 8,
    rehydrated: true,
  },
}

describe('migration to v9', () => {
  it('should delete deprecated lists', async () => {
    const migrator = createMigrate(
      {
        1: migration1,
        2: migration2,
        3: migration3,
        4: migration4,
        5: migration5,
        6: migration6,
        7: migration7,
        8: migration8,
        9: migration9,
      },
      { debug: false },
    )
    const result: any = await migrator(previousState, 9)
    expect(result?.lists?.byUrl?.[COINGECKO_AVAX_LIST]).toBeDefined()
    expect(result?.lists.randomURL).toBeUndefined()
    expect(result?._persist.version).toEqual(9)
  })
})
