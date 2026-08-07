import { Flex } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'

export function CarouselScrollButtonVisual({ direction }: { direction: 'left' | 'right' }): JSX.Element {
  return (
    <Flex
      boxShadow="0 0 20px 0 rgba(0, 0, 0, 0.1)"
      borderRadius="$roundedFull"
      transform="translateY(-50%)"
      backgroundColor="$surface2"
      hoverStyle={{ backgroundColor: '$surface2Hovered' }}
      p="$spacing12"
      borderWidth="$spacing1"
      borderStyle="solid"
      borderColor="$surface3"
      $platform-web={{ backdropFilter: 'blur(2px)' }}
    >
      <ArrowRight color="$neutral1" size="$icon.12" transform={direction === 'left' ? 'rotate(180deg)' : undefined} />
    </Flex>
  )
}
