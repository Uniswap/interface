import { Token } from '@uniswap/sdk-core'
import { createMigrate } from 'redux-persist'
import { migration1 } from 'state/migrations/1'
import { migration2 } from 'state/migrations/2'
import { migration3, PersistAppStateV3 } from 'state/migrations/3'
import { RouterPreference } from 'state/routing/types'
import { SlippageTolerance } from 'state/user/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const previousState: PersistAppStateV3 = {
  user: {
    userLocale: null,
    userRouterPreference: RouterPreference.API,
    userHideClosedPositions: false,
    userSlippageTolerance: SlippageTolerance.Auto,
    userSlippageToleranceHasBeenMigratedToAuto: true,
    userDeadline: 1800,
    tokens: {
      // wrong tokens
      [UniverseChainId.Optimism]: {
        '0x7F5c764cBc14f9669B88837ca1490cCa17c31607': new Token(
          UniverseChainId.Optimism,
          '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
          6,
          'USDC',
          'USD Coin',
        ),
      },
      [UniverseChainId.Base]: {
        '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA': new Token(
          UniverseChainId.Base,
          '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
          6,
          'USDC',
          'USD Coin',
        ),
      },
    },
    pairs: {},
    timestamp: Date.now(),
  },
  _persist: {
    version: 2,
    rehydrated: true,
  },
}

describe('migration to v3', () => {
  it('should migrate users who currently have outdated USDC.e saved', async () => {
    const migrator = createMigrate(
      {
        1: migration1,
        2: migration2,
        3: migration3,
      },
      { debug: false },
    )
    const result: any = await migrator(previousState, 3)
    expect(Object.keys(result?.user?.tokens).length).toEqual(2)
    expect(
      result?.user?.tokens[UniverseChainId.Optimism]?.['0x7F5c764cBc14f9669B88837ca1490cCa17c31607'].symbol,
    ).toEqual('USDC.e')
    expect(result?.user?.tokens[UniverseChainId.Optimism]?.['0x7F5c764cBc14f9669B88837ca1490cCa17c31607'].name).toEqual(
      'Bridged USDC',
    )
    expect(result?.user?.tokens[UniverseChainId.Base]?.['0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA'].symbol).toEqual(
      'USDbC',
    )
    expect(result?.user?.tokens[UniverseChainId.Base]?.['0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA'].name).toEqual(
      'USD Base Coin',
    )

    expect(result?._persist.version).toEqual(3)
  })
})
