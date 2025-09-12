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
import { migration16, PersistAppStateV16 } from 'state/migrations/16'
import { DAI_ARBITRUM_ONE, USDC } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { serializeToken } from 'uniswap/src/utils/currency'

const tokenMap = {
  [UniverseChainId.Mainnet]: {
    [USDC.address]: serializeToken(USDC),
  },
  [UniverseChainId.ArbitrumOne]: {
    [DAI_ARBITRUM_ONE.address]: serializeToken(DAI_ARBITRUM_ONE),
  },
}

const previousState: PersistAppStateV16 = {
  _persist: {
    version: 15,
    rehydrated: true,
  },
  user: { tokens: tokenMap },
}

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
  },
  { debug: false },
)

describe('migration to v16', () => {
  it('migrates from user.tokens to shared tokens slice', async () => {
    const result: any = await migrator(previousState, 16)
    expect(result.user.tokens).toBe(undefined)
    expect(result.tokens.dismissedTokenWarnings).toMatchObject(tokenMap)
  })
})
