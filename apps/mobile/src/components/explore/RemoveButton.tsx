import { AnimatedTouchableArea, Flex, TouchableAreaProps } from 'ui/src'
import { imageSizes } from 'ui/src/theme'

type RemoveButtonProps = TouchableAreaProps & {
  visible?: boolean
}

export default function RemoveButton({ visible = true, ...rest }: RemoveButtonProps): JSX.Element {
  return (
    <AnimatedTouchableArea
      alignItems="center"
      backgroundColor="$neutral3"
      borderRadius="$roundedFull"
      disabled={!visible}
      height={imageSizes.image24}
      justifyContent="center"
      opacity={visible ? 1 : 0}
      testID="explore/remove-button"
      width={imageSizes.image24}
      zIndex="$tooltip"
      {...rest}
    >
      <Flex backgroundColor="$surface1" borderRadius="$rounded12" height={2} width={10} />
    </AnimatedTouchableArea>
  )
}
