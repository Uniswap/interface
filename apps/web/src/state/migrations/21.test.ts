import { createMigrate } from 'redux-persist'
import { migration1 } from 'state/migrations/1'
import { migration2 } from 'state/migrations/2'
import { migration3 } from 'state/migrations/3'
import { migration4 } from 'state/migrations/4'
import { migration5 } from 'state/migrations/5'
import { migration6 } from 'state/migrations/6'
import { migration7 } from 'state/migrations/7'
import { migration8 } from 'state/migrations/8'
import { migration9 } from 'state/migrations/9'
import { migration10 } from 'state/migrations/10'
import { migration11 } from 'state/migrations/11'
import { migration12 } from 'state/migrations/12'
import { migration13 } from 'state/migrations/13'
import { migration14 } from 'state/migrations/14'
import { migration15 } from 'state/migrations/15'
import { migration16 } from 'state/migrations/16'
import { migration17 } from 'state/migrations/17'
import { migration18 } from 'state/migrations/18'
import { migration19 } from 'state/migrations/19'
import { migration20 } from 'state/migrations/20'
import { migration21, PersistAppStateV21 } from 'state/migrations/21'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

describe('migration to v21', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

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
      10: migration10,
      11: migration11,
      12: migration12,
      13: migration13,
      14: migration14,
      15: migration15,
      16: migration16,
      17: migration17,
      18: migration18,
      19: migration19,
      20: migration20,
      21: migration21,
    },
    { debug: false },
  )

  it('should convert uppercase token warning addresses to lowercase', async () => {
    const state: PersistAppStateV21 = {
      tokens: {
        dismissedTokenWarnings: {
          '1': {
            '0x1234567890123456789012345678901234567890': {
              address: '0x1234567890123456789012345678901234567890',
              chainId: UniverseChainId.Mainnet,
              symbol: 'TEST',
              name: 'Test Token',
              decimals: 18,
            },
          },
        },
      },
      _persist: {
        version: 20,
        rehydrated: true,
      },
    }

    const result: any = await migrator(state, 21)
    expect(result.tokens?.dismissedTokenWarnings['1']).toHaveProperty('0x1234567890123456789012345678901234567890')
    expect(result._persist.version).toEqual(21)
  })

  it('should handle undefined tokens state', async () => {
    const state = {
      _persist: {
        version: 20,
        rehydrated: true,
      },
    }
    const result: any = await migrator(state, 21)
    expect(result.tokens?.dismissedTokenWarnings).toBeUndefined()
    expect(result._persist.version).toEqual(21)
  })

  it('should handle empty dismissedTokenWarnings object', async () => {
    const state: PersistAppStateV21 = {
      tokens: {
        dismissedTokenWarnings: {},
      },
      _persist: {
        version: 20,
        rehydrated: true,
      },
    }
    const result: any = await migrator(state, 21)
    expect(result.tokens?.dismissedTokenWarnings).toEqual({})
    expect(result._persist.version).toEqual(21)
  })

  it('should skip invalid addresses', async () => {
    const state: PersistAppStateV21 = {
      tokens: {
        dismissedTokenWarnings: {
          '1': {
            '0x1234567890123456789012345678901234567890': {
              address: '0x1234567890123456789012345678901234567890',
              chainId: UniverseChainId.Mainnet,
              symbol: 'TEST',
              name: 'Test Token',
              decimals: 18,
            },
            'invalid-address': {
              address: 'invalid-address',
              chainId: UniverseChainId.Mainnet,
              symbol: 'TEST',
              name: 'Test Token',
              decimals: 18,
            },
          },
        },
      },
      _persist: {
        version: 20,
        rehydrated: true,
      },
    }
    const result: any = await migrator(state, 21)
    expect(Object.keys(result.tokens?.dismissedTokenWarnings['1'])).toHaveLength(1)
    expect(result.tokens?.dismissedTokenWarnings['1']).toHaveProperty('0x1234567890123456789012345678901234567890')
    expect(result.tokens?.dismissedTokenWarnings['1']).not.toHaveProperty('invalid-address')
    expect(result._persist.version).toEqual(21)
  })
})
