import { IconSizeTokens } from 'ui/src/theme'
import { DisplayName } from 'uniswap/src/features/accounts/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type AnimatedUnitagDisplayNameProps = {
  displayName: DisplayName
  unitagIconSize?: IconSizeTokens
  address?: string
}

/**
 * Renders as a bottom sheet modal on mobile app/mweb & a dialog modal on desktop web/extension.
 */
export function AnimatedUnitagDisplayName(_: AnimatedUnitagDisplayNameProps): JSX.Element {
  throw new PlatformSplitStubError('AnimatedUnitagDisplayName')
}
