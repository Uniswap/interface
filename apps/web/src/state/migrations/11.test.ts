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
import { migration10, PersistAppStateV10 } from 'state/migrations/10'
import { migration11 } from 'state/migrations/11'
import { RouterPreference } from 'state/routing/types'
import { SlippageTolerance } from 'state/user/types'

const persistUserState: PersistAppStateV10['user'] = {
  userRouterPreference: RouterPreference.X,
  userLocale: null,
  userHideClosedPositions: false,
  userSlippageTolerance: SlippageTolerance.Auto,
  userSlippageToleranceHasBeenMigratedToAuto: true,
  userDeadline: 1800,
  tokens: {},
  pairs: {},
  timestamp: Date.now(),
}

const previousStateWithMeta: PersistAppStateV10 = {
  user: {
    recentConnectionMeta: { type: 'Injected' },
    ...persistUserState,
  },
  _persist: {
    version: 9,
    rehydrated: true,
  },
}

const previousStateWithoutMeta: PersistAppStateV10 = {
  user: {
    recentConnectionMeta: undefined,
    ...persistUserState,
  },
  _persist: {
    version: 9,
    rehydrated: true,
  },
}
describe('migration to v10', () => {
  it('should migrate users who have undefined recentConnectionMeta', async () => {
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
      },
      { debug: false },
    )
    const result: any = await migrator(previousStateWithMeta, 11)

    expect(Object.keys(result.user)).not.toContain('recentConnectionMeta')
  })

  it('should migrate users who have defined recentConnectionMeta', async () => {
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
      },
      { debug: false },
    )
    const result: any = await migrator(previousStateWithoutMeta, 11)
    expect(Object.keys(result.user)).not.toContain('recentConnectionMeta')
  })
})
