import { CarouselScrollButtonVisual } from '~/pages/Explore/rwa/shelf/CarouselScrollButtonVisual'

export function CarouselScrollButton({
  direction,
  onPress,
}: {
  direction: 'left' | 'right'
  onPress: () => void
}): JSX.Element {
  const isLeft = direction === 'left'

  return (
    <button
      type="button"
      aria-label={isLeft ? 'Scroll carousel left' : 'Scroll carousel right'}
      onClick={onPress}
      style={{
        border: 'none',
        background: 'transparent',
        padding: 0,
        margin: 0,
        cursor: 'pointer',
        display: 'block',
      }}
    >
      <CarouselScrollButtonVisual direction={direction} />
    </button>
  )
}
