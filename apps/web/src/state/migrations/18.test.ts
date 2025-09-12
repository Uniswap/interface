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
import { migration18, PersistAppStateV18 } from 'state/migrations/18'

const previousState: PersistAppStateV18 = {
  _persist: {
    version: 17,
    rehydrated: true,
  },
  userSettings: {
    hideSmallBalances: true,
    hideSpamTokens: true,
  },
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
    17: migration17,
    18: migration18,
  },
  { debug: false },
)

describe('migration to v18', () => {
  it('should set user settings object', async () => {
    const result: any = await migrator(previousState, 18)
    expect(result.userSettings).toMatchObject({
      hideSmallBalances: true,
      hideSpamTokens: true,
      currentLanguage: 'en',
      currentCurrency: 'USD',
    })
  })
})
