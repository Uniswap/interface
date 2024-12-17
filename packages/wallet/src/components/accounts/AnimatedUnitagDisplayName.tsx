import { IconSizeTokens } from 'ui/src/theme'
import { PlatformSplitStubError } from 'utilities/src/errors'
import { DisplayName } from 'wallet/src/features/wallet/types'

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
