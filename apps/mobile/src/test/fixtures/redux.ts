import { PreloadedState } from 'redux'
import { MobileState } from 'src/app/reducer'
import { ModalsState } from 'src/features/modals/ModalsState'
import { initialModalsState } from 'src/features/modals/modalSlice'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { SharedState } from 'wallet/src/state/reducer'
import { preloadedSharedState } from 'wallet/src/test/fixtures'
import { createFixture } from 'wallet/src/test/utils'

export const preloadedModalsState = createFixture<ModalsState>()(() => ({
  ...initialModalsState,
}))

type PreloadedMobileStateOptions = {
  account: Account | undefined
}

export const preloadedMobileState = createFixture<
  PreloadedState<MobileState>,
  PreloadedMobileStateOptions
>({
  account: undefined,
})(({ account }) => ({
  ...(preloadedSharedState({ account }) as PreloadedState<SharedState>),
}))
