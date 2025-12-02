import { PreloadedState } from 'redux'
import { ExtensionState } from 'src/store/extensionReducer'
import { createFixture } from 'uniswap/src/test/utils'
import { preloadedWalletPackageState } from 'wallet/src/test/fixtures'

type PreloadedExtensionStateOptions = Record<string, never>

type PreloadedExtensionStateFactory = (
  overrides?: Partial<PreloadedState<ExtensionState> & PreloadedExtensionStateOptions>,
) => PreloadedState<ExtensionState>

export const preloadedExtensionState: PreloadedExtensionStateFactory = createFixture<
  PreloadedState<ExtensionState>,
  PreloadedExtensionStateOptions
>({})(() => ({
  ...preloadedWalletPackageState(),
}))
