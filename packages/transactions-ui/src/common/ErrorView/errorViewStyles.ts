import type { ButtonProps, FlexProps, TextProps } from '@universe/mycelium'
import { PlatformSplitStubError } from 'utilities/src/errors'

/** @internal */
export interface ErrorViewStyles {
  paddingX: FlexProps['px']
  paddingBottom: FlexProps['pb']
  titleVariant: TextProps['variant']
  buttonSize: ButtonProps['size']
  /** Web only: the link hover color the old TouchableTextLink had. Native has no hover. */
  learnMoreHoverStyle: TextProps['hoverStyle']
}

/** @internal Platform split base: bundlers resolve errorViewStyles.web or errorViewStyles.native. */
export const ERROR_VIEW_STYLES: ErrorViewStyles = (() => {
  throw new PlatformSplitStubError('ERROR_VIEW_STYLES')
})()
