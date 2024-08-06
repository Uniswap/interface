import { PropsWithChildren } from 'react'

export type SwipeableCardProps = PropsWithChildren<{
  stackIndex: number
  cardHeight: number
  disableSwipe: boolean
  onSwiped: () => void
  onLayout: ({ height, yOffset }: { height: number; yOffset: number }) => void
}>

export type SwipeableCardStackProps<T> = {
  cards: T[]
  renderCard: (card: T, index: number) => JSX.Element
  onSwiped?: (index: number) => void
}
