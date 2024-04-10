import { createMigrate } from 'redux-persist'
import { RouterPreference } from 'state/routing/types'
import { SlippageTolerance } from 'state/user/types'

import { migration1, PersistAppStateV1 } from './1'

const previousState: PersistAppStateV1 = {
  user: {
    userLocale: null,
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
    version: 0,
    rehydrated: true,
  },
}

describe('migration to v1', () => {
  it('should migrate the default deadline', async () => {
    const migrator = createMigrate(
      {
        1: migration1,
      },
      { debug: false }
    )
    const result: any = await migrator(previousState, 1)
    expect(result?.user?.userDeadline).toEqual(600)
    expect(result?._persist.version).toEqual(1)

    expect(result?.user?.userLocale).toEqual(null)
    expect(result?.user?.userRouterPreference).toEqual(RouterPreference.API)
    expect(result?.user?.userHideClosedPositions).toEqual(false)
    expect(result?.user?.userSlippageTolerance).toEqual(SlippageTolerance.Auto)
    expect(result?.user?.userSlippageToleranceHasBeenMigratedToAuto).toEqual(true)
    expect(result?.user?.tokens).toEqual({})
    expect(result?.user?.pairs).toEqual({})
    expect(result?.user?.timestamp).toEqual(previousState.user?.timestamp)
  })

  it('should not migrate a non-default value', async () => {
    const migrator = createMigrate(
      {
        1: migration1,
      },
      { debug: false }
    )
    const result: any = await migrator(
      {
        ...previousState,
        user: {
          ...previousState.user,
          userDeadline: 300,
        },
      } as PersistAppStateV1,
      1
    )
    expect(result?.user?.userDeadline).toEqual(300)
  })

  it('should not migrate if user state is not set', async () => {
    const migrator = createMigrate(
      {
        1: migration1,
      },
      { debug: false }
    )
    const result: any = await migrator(
      {
        ...previousState,
        user: undefined,
      } as PersistAppStateV1,
      1
    )
    expect(result?.user?.userDeadline).toBeUndefined()
  })
})
