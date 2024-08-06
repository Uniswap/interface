import { PreloadedState } from 'redux'
import { ExtensionState } from 'src/store/extensionReducer'
import { createFixture } from 'uniswap/src/test/utils'
import { SharedState } from 'wallet/src/state/reducer'
import { preloadedSharedState } from 'wallet/src/test/fixtures'

type PreloadedExtensionStateOptions = Record<string, never>

export const preloadedExtensionState = createFixture<PreloadedState<ExtensionState>, PreloadedExtensionStateOptions>(
  {},
)(() => ({
  ...(preloadedSharedState() as PreloadedState<SharedState>),
}))
