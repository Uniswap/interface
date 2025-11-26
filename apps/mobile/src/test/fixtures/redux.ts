import { PreloadedState } from 'redux'
import { MobileState } from 'src/app/mobileReducer'
import { ModalsState } from 'src/features/modals/ModalsState'
import { initialModalsState } from 'src/features/modals/modalSlice'
import { createFixture } from 'uniswap/src/test/utils'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { preloadedWalletPackageState } from 'wallet/src/test/fixtures'

export const preloadedModalsState = createFixture<ModalsState>()(() => ({
  ...initialModalsState,
}))

type PreloadedMobileStateOptions = {
  account: Account | undefined
}

type PreloadedMobileStateFactory = (
  overrides?: Partial<PreloadedState<MobileState> & PreloadedMobileStateOptions>,
) => PreloadedState<MobileState>

export const preloadedMobileState: PreloadedMobileStateFactory = createFixture<
  PreloadedState<MobileState>,
  PreloadedMobileStateOptions
>({
  account: undefined,
})(({ account }) => ({
  ...preloadedWalletPackageState({ account }),
}))
