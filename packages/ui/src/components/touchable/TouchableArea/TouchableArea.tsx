import { AnimatedProps } from 'react-native-reanimated'
import { withStaticProperties } from 'tamagui'
import type { TouchableAreaProps } from 'ui/src/components/touchable/TouchableArea/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type { TouchableAreaEvent, TouchableAreaProps } from './types'

type TextProps = React.ComponentProps<typeof import('ui/src/components/text').Text>
type ThemedIconProps = React.ComponentProps<
  typeof import('ui/src/components/buttons/Button/components/ThemedIcon').ThemedIcon
>

export const TouchableArea = withStaticProperties(
  (_props: TouchableAreaProps) => {
    throw new PlatformSplitStubError('TouchableArea')
  },
  {
    Text: (_props: TextProps) => {
      throw new PlatformSplitStubError('TouchableArea.Text')
    },
    Icon: (_props: ThemedIconProps) => {
      throw new PlatformSplitStubError('TouchableArea.Icon')
    },
  },
)

export const AnimatedTouchableArea = withStaticProperties(
  (_props: AnimatedProps<TouchableAreaProps>) => {
    throw new PlatformSplitStubError('AnimatedTouchableArea')
  },
  {
    Text: (_props: AnimatedProps<TextProps>) => {
      throw new PlatformSplitStubError('AnimatedTouchableArea.Text')
    },
    Icon: (_props: AnimatedProps<ThemedIconProps>) => {
      throw new PlatformSplitStubError('AnimatedTouchableArea.Icon')
    },
  },
)
