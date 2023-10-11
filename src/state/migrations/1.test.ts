import { RouterPreference } from 'state/routing/types'
import { UserState } from 'state/user/reducer'
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
    hideBaseWalletBanner: false,
  },
  _persist: {
    version: 0,
    rehydrated: true,
  },
}

describe('migration to v1', () => {
  it('should migrate the default deadline', () => {
    const result = migration1(previousState)
    expect(result?.user?.userDeadline).toEqual(600)
  })

  it('should not migrate a non-default value', () => {
    const result = migration1({
      ...previousState,
      user: {
        ...previousState.user,
        userDeadline: 300,
      } as UserState,
    })
    expect(result?.user?.userDeadline).toEqual(300)
  })

  it('should not migrate if user state is not set', () => {
    const result = migration1({
      ...previousState,
      user: undefined,
    })
    expect(result?.user?.userDeadline).toBeUndefined()
  })
})
