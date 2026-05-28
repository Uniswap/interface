import { createMigrate } from 'redux-persist'
import { migration1 } from 'state/migrations/1'
import { migration2, PersistAppStateV2 } from 'state/migrations/2'
import { RouterPreference } from 'state/routing/types'
import { SlippageTolerance } from 'state/user/types'

const previousState: PersistAppStateV2 = {
  user: {
    userLocale: null,
    // @ts-ignore this is intentionally a string and not the `RouterPreference` enum because `client` is a deprecated option
    userRouterPreference: 'client',
    userHideClosedPositions: false,
    userSlippageTolerance: SlippageTolerance.Auto,
    userSlippageToleranceHasBeenMigratedToAuto: true,
    userDeadline: 1800,
    tokens: {},
    pairs: {},
    timestamp: Date.now(),
  },
  _persist: {
    version: 1,
    rehydrated: true,
  },
}

describe('migration to v2', () => {
  it('should migrate users who currently have `client` router preference', async () => {
    const migrator = createMigrate(
      {
        1: migration1,
        2: migration2,
      },
      { debug: false },
    )
    const result: any = await migrator(previousState, 2)
    expect(result?.user?.userRouterPreference).toEqual(RouterPreference.API)
    expect(result?._persist.version).toEqual(2)
  })

  it('should not migrate non-client router preference', async () => {
    const migrator = createMigrate(
      {
        1: migration1,
        2: migration2,
      },
      { debug: false },
    )
    const result: any = await migrator(
      {
        ...previousState,
        user: {
          ...previousState.user,
          userRouterPreference: RouterPreference.X,
        },
      } as PersistAppStateV2,
      2,
    )
    expect(result?.user?.userRouterPreference).toEqual(RouterPreference.X)
  })
})
