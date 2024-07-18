import { PreloadedState } from 'redux'
import { WebState } from 'src/store/webReducer'
import { SharedState } from 'wallet/src/state/reducer'
import { preloadedSharedState } from 'wallet/src/test/fixtures'
import { createFixture } from 'wallet/src/test/utils'

type PreloadedExtensionStateOptions = Record<string, never>

export const preloadedExtensionState = createFixture<PreloadedState<WebState>, PreloadedExtensionStateOptions>({})(
  () => ({
    ...(preloadedSharedState() as PreloadedState<SharedState>),
  }),
)
