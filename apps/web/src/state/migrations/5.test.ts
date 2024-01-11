import { createMigrate } from 'redux-persist'
import { RouterPreference } from 'state/routing/types'
import { SlippageTolerance } from 'state/user/types'

import { migration1 } from './1'
import { migration2 } from './2'
import { migration3 } from './3'
import { migration4 } from './4'
import { migration5, PersistAppStateV5 } from './5'

const previousState: PersistAppStateV5 = {
  user: {
    userRouterPreference: RouterPreference.API,
    optedOutOfUniswapX: false,
    disabledUniswapX: false,
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
    version: 4,
    rehydrated: true,
  },
}

describe('migration to v5', () => {
  it('should migrate users who currently have `API` router preference', async () => {
    const migrator = createMigrate(
      {
        1: migration1,
        2: migration2,
        3: migration3,
        4: migration4,
        5: migration5,
      },
      { debug: false }
    )
    const result: any = await migrator(previousState, 5)
    expect(result?.user?.userRouterPreference).toEqual(RouterPreference.X)
    expect(result?.user?.disabledUniswapX).toBeUndefined()
    expect(result?.user?.optedOutOfUniswapX).toBeUndefined()
    expect(result?._persist.version).toEqual(5)
  })

  it('should not migrate routerPreference if user disabled during rollout', async () => {
    const migrator = createMigrate(
      {
        1: migration1,
        2: migration2,
        3: migration3,
        4: migration4,
        5: migration5,
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
      } as PersistAppStateV5,
      5
    )
    expect(result?.user?.userRouterPreference).toEqual(RouterPreference.API)
    expect(result?.user?.optedOutOfUniswapX).toBeUndefined()
    expect(result?._persist.version).toEqual(5)
  })

  it('should not migrate user if user does not exist', async () => {
    const migrator = createMigrate(
      {
        1: migration1,
        2: migration2,
        3: migration3,
        4: migration4,
        5: migration5,
      },
      { debug: false }
    )
    const result: any = await migrator(
      {
        ...previousState,
        user: undefined,
      } as PersistAppStateV5,
      5
    )
    expect(result?.user).toBeUndefined()
    expect(result?._persist.version).toEqual(5)
  })
})
