import { createMigrate } from 'redux-persist'
import { RouterPreference } from 'state/routing/types'
import { SlippageTolerance } from 'state/user/types'

import { migration1 } from './1'
import { migration2 } from './2'
import { migration3 } from './3'
import { migration4, PersistAppStateV4 } from './4'

const previousState: PersistAppStateV4 = {
  user: {
    userRouterPreference: RouterPreference.API,
    optedOutOfUniswapX: false,
    userLocale: null,
    userHideClosedPositions: false,
    userSlippageTolerance: SlippageTolerance.Auto,
    userSlippageToleranceHasBeenMigratedToAuto: true,
    userDeadline: 1800,
    tokens: {},
    pairs: {},
    timestamp: Date.now(),
    hideAndroidAnnouncementBanner: false,
  },
  _persist: {
    version: 3,
    rehydrated: true,
  },
}

describe('migration to v4', () => {
  it('should migrate users who currently have `API` router preference', async () => {
    const migrator = createMigrate(
      {
        1: migration1,
        2: migration2,
        3: migration3,
        4: migration4,
      },
      { debug: false }
    )
    const result: any = await migrator(previousState, 4)
    expect(result?.user?.userRouterPreference).toEqual(RouterPreference.X)
    expect(result?._persist.version).toEqual(4)
  })

  it('should not migrate if user disabled during rollout', async () => {
    const migrator = createMigrate(
      {
        1: migration1,
        2: migration2,
        3: migration3,
        4: migration4,
      },
      { debug: false }
    )
    const result: any = await migrator(
      {
        ...previousState,
        user: {
          ...previousState.user,
          optedOutOfUniswapX: true,
        },
      } as PersistAppStateV4,
      4
    )
    expect(result?.user?.userRouterPreference).toEqual(RouterPreference.API)
  })
})
