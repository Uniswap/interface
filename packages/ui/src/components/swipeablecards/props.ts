import { PropsWithChildren } from 'react'

export const SWIPEABLE_CARD_Y_OFFSET = 8

export type SwipeableCardProps = PropsWithChildren<{
  stackIndex: number
  cardHeight: number
  disableSwipe: boolean
  onSwiped: () => void
  onLayout: ({ height, yOffset }: { height: number; yOffset: number }) => void
}>

export type SwipeableCardStackProps<T> = {
  cards: T[]
  minCardHeight?: number // min height to minimize the layout shift after cards are measured

  keyExtractor: (card: T) => string
  renderCard: (card: T, index: number) => JSX.Element
  onSwiped?: (card: T, index: number) => void
}
