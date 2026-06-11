import { Flex } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { CarouselScrollButton } from '~/pages/Explore/rwa/shelf/CarouselScrollButton'

const ARROW_HIDE_OFFSET = {
  left: -12,
  right: 12,
} as const

const ARROW_TRANSITION = 'opacity 200ms ease, transform 200ms ease'

export function CarouselScrollButtonOverlay({
  direction,
  visible,
  onPress,
}: {
  direction: 'left' | 'right'
  visible: boolean
  onPress: () => void
}): JSX.Element {
  const isLeft = direction === 'left'
  const hideOffset = ARROW_HIDE_OFFSET[direction]

  return (
    <Flex
      position="absolute"
      top="50%"
      left={isLeft ? 0 : undefined}
      right={isLeft ? undefined : 0}
      pl={isLeft ? '$spacing12' : undefined}
      pr={isLeft ? undefined : '$spacing12'}
      zIndex={zIndexes.dropdown}
      opacity={visible ? 1 : 0}
      pointerEvents={visible ? 'auto' : 'none'}
      $platform-web={{
        transform: `translateX(${visible ? 0 : hideOffset}px)`,
        transition: ARROW_TRANSITION,
      }}
    >
      <CarouselScrollButton direction={direction} onPress={onPress} />
    </Flex>
  )
}
