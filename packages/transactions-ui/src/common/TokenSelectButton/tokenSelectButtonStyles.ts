import type { SpaceTokens } from '@universe/mycelium'
import { PlatformSplitStubError } from 'utilities/src/errors'

/** @internal */
export interface TokenSelectButtonStyles {
  /** Right padding of the static badge; web leaves it to `p`. */
  badgePr: SpaceTokens | undefined
}

/** @internal Platform split base: bundlers resolve tokenSelectButtonStyles.web or tokenSelectButtonStyles.native. */
export const TOKEN_SELECT_BUTTON_STYLES: TokenSelectButtonStyles = (() => {
  throw new PlatformSplitStubError('TOKEN_SELECT_BUTTON_STYLES')
})()
