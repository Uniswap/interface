import { ConnectionType } from 'connection/types'
import { createMigrate } from 'redux-persist'
import { RouterPreference } from 'state/routing/types'
import { SlippageTolerance } from 'state/user/types'

import { migration1 } from './1'
import { migration2 } from './2'
import { migration3 } from './3'
import { migration4 } from './4'
import { migration5 } from './5'
import { migration6, PersistAppStateV6 } from './6'

const persistUserState: PersistAppStateV6['user'] = {
  userRouterPreference: RouterPreference.X,
  userLocale: null,
  userHideClosedPositions: false,
  userSlippageTolerance: SlippageTolerance.Auto,
  userSlippageToleranceHasBeenMigratedToAuto: true,
  userDeadline: 1800,
  tokens: {},
  pairs: {},
  timestamp: Date.now(),
  hideAppPromoBanner: false,
}

const previousStateUnselected: PersistAppStateV6 = {
  user: {
    selectedWallet: undefined,
    ...persistUserState,
  },
  _persist: {
    version: 5,
    rehydrated: true,
  },
}

const previousStateSelected: PersistAppStateV6 = {
  user: {
    selectedWallet: ConnectionType.INJECTED,
    ...persistUserState,
  },
  _persist: {
    version: 5,
    rehydrated: true,
  },
}

describe('migration to v6', () => {
  it('should migrate users who have undefined selectedWallet in user state', async () => {
    const migrator = createMigrate(
      {
        1: migration1,
        2: migration2,
        3: migration3,
        4: migration4,
        5: migration5,
        6: migration6,
      },
      { debug: false }
    )
    const result: any = await migrator(previousStateUnselected, 6)
    expect(Object.keys(result)).not.toContain('selectedWallet')
    expect(result?.user?.recentConnectionMeta).toBeUndefined()
  })

  it('should migrate users who have defined selectedWallet in user state', async () => {
    const migrator = createMigrate(
      {
        1: migration1,
        2: migration2,
        3: migration3,
        4: migration4,
        5: migration5,
        6: migration6,
      },
      { debug: false }
    )
    const result: any = await migrator(previousStateSelected, 6)
    expect(Object.keys(result)).not.toContain('selectedWallet')
    expect(result?.user?.recentConnectionMeta).toMatchObject({ type: ConnectionType.INJECTED })
  })
})
