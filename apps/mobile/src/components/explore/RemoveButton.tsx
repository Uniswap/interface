import { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { AnimatedTouchableArea, Flex, TouchableAreaProps } from 'ui/src'
import { imageSizes } from 'ui/src/theme'

type RemoveButtonProps = TouchableAreaProps & {
  visible?: boolean
}

export default function RemoveButton({ visible = true, ...rest }: RemoveButtonProps): JSX.Element {
  const animatedVisibilityStyle = useAnimatedStyle(() => ({
    opacity: visible ? withTiming(1) : withTiming(0),
  }))

  return (
    <AnimatedTouchableArea
      hapticFeedback
      alignItems="center"
      backgroundColor="$neutral3"
      borderRadius="$roundedFull"
      height={imageSizes.image24}
      justifyContent="center"
      style={animatedVisibilityStyle}
      width={imageSizes.image24}
      zIndex="$tooltip"
      {...rest}>
      <Flex backgroundColor="$surface1" borderRadius="$rounded12" height={2} width={10} />
    </AnimatedTouchableArea>
  )
}
