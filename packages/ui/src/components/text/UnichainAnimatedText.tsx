import { GetProps, ThemeKeys } from 'tamagui'
import { Text } from 'ui/src/components/text'
import { PlatformSplitStubError } from 'utilities/src/errors'

export interface UnichainAnimatedTextProps extends GetProps<typeof Text> {
  /**
   * The color of the text before and after the gradient.
   * @default "neutral1"
   */
  gradientTextColor?: ThemeKeys
  /**
   * The delay in milliseconds before the gradient animation starts.
   * @default 375
   */
  delayMs?: number
  /**
   * Whether the gradient animation is enabled.
   * @default true
   */
  enabled?: boolean
  /**
   * The final resting position of the gradient's translateX value after the animation completes on native.
   * Dependent on the width of the parent element.
   * @default -125
   */
  gradientEndingXPlacement?: number
}

export function UnichainAnimatedText(_props: UnichainAnimatedTextProps): JSX.Element {
  throw new PlatformSplitStubError('UnichainAnimatedText')
}
