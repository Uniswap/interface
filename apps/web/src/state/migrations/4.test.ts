import { DEFAULT_LOCALE } from 'constants/locales'
import { createMigrate } from 'redux-persist'
import { RouterPreference } from 'state/routing/types'
import { SlippageTolerance } from 'state/user/types'

import { migration1 } from './1'
import { migration2 } from './2'
import { migration3 } from './3'
import { migration4, PersistAppStateV4 } from './4'

const previousState: PersistAppStateV4 = {
  user: {
    userLocale: 'de-DE',
    userRouterPreference: RouterPreference.API,
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
    version: 3,
    rehydrated: true,
  },
}

describe('migration to v4', () => {
  it('should migrate users who currently have German as their set locale', async () => {
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
    expect(result.user.userLocale).toEqual(DEFAULT_LOCALE)

    expect(result?._persist.version).toEqual(4)
  })
})
