import { Flex, TouchableArea } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'

type ScrollButtonDirection = 'left' | 'right'

export type ScrollButtonProps = {
  onPress: () => void
  opacity?: number
  direction: ScrollButtonDirection
}

export const ScrollButton = ({ onPress, opacity, direction }: ScrollButtonProps) => (
  <TouchableArea onPress={onPress}>
    <Flex
      boxShadow="0 0 20px 0 rgba(0, 0, 0, 0.1)"
      borderRadius="$roundedFull"
      transform="translateY(-50%)"
      backgroundColor="$surface2"
      hoverStyle={{ backgroundColor: '$surface2Hovered' }}
      p="$spacing12"
      borderWidth={1}
      borderStyle="solid"
      borderColor="$surface3"
      $platform-web={{ backdropFilter: 'blur(2px)' }}
      opacity={opacity}
      transition="opacity 0.2s ease-in-out"
    >
      <ArrowRight color="$neutral1" size="$icon.12" transform={direction === 'left' ? 'rotate(180deg)' : undefined} />
    </Flex>
  </TouchableArea>
)
