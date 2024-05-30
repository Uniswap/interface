import { createMigrate } from 'redux-persist'
import { RouterPreference } from 'state/routing/types'
import { SlippageTolerance } from 'state/user/types'

import { migration1 } from './1'
import { migration2 } from './2'
import { migration3 } from './3'
import { migration4 } from './4'
import { migration5 } from './5'
import { migration6 } from './6'
import { migration7, PersistAppStateV7 } from './7'

const previousState: PersistAppStateV7 = {
  user: {
    userRouterPreference: RouterPreference.API,
    userLocale: null,
    userHideClosedPositions: false,
    userSlippageTolerance: SlippageTolerance.Auto,
    userSlippageToleranceHasBeenMigratedToAuto: true,
    userDeadline: 1800,
    tokens: {},
    pairs: {},
    timestamp: Date.now(),
    hideAppPromoBanner: false,
  },
  _persist: {
    version: 6,
    rehydrated: true,
  },
}

describe('migration to v7', () => {
  it('should migrate users who currently have `hideAndroidAnnouncementBanner` preference', async () => {
    const migrator = createMigrate(
      {
        1: migration1,
        2: migration2,
        3: migration3,
        4: migration4,
        5: migration5,
        6: migration6,
        7: migration7,
      },
      { debug: false }
    )
    const result: any = await migrator(previousState, 7)
    expect(result?.user?.hideAndroidAnnouncementBanner).toBeUndefined()
    expect(result?.user?.hideAppPromoBanner).toEqual(false)
    expect(result?._persist.version).toEqual(7)
  })

  it('should not change hideAppPromoBanner value if user already hideAndroidAnnouncementBanner', async () => {
    const migrator = createMigrate(
      {
        1: migration1,
        2: migration2,
        3: migration3,
        4: migration4,
        5: migration5,
        6: migration6,
        7: migration7,
      },
      { debug: false }
    )
    const result: any = await migrator(
      {
        ...previousState,
        user: {
          ...previousState.user,
          hideAndroidAnnouncementBanner: true,
        },
      } as PersistAppStateV7,
      7
    )
    expect(result?.user?.hideAppPromoBanner).toEqual(true)
    expect(result?.user?.hideAndroidAnnouncementBanner).toBeUndefined()
    expect(result?._persist.version).toEqual(7)
  })

  it('should not migrate user if user does not exist', async () => {
    const migrator = createMigrate(
      {
        1: migration1,
        2: migration2,
        3: migration3,
        4: migration4,
        5: migration5,
        6: migration6,
        7: migration7,
      },
      { debug: false }
    )
    const result: any = await migrator(
      {
        ...previousState,
        user: undefined,
      } as PersistAppStateV7,
      7
    )
    expect(result?.user).toBeUndefined()
    expect(result?._persist.version).toEqual(7)
  })
})
