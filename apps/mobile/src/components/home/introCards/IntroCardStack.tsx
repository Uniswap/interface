import { IntroCard, IntroCardProps } from 'src/components/home/introCards/IntroCard'
import { SwipeableCardStack } from 'ui/src/components/swipeablecards/SwipeableCardStack'

type IntroCardStackProps = {
  cards: IntroCardProps[]
}
export function IntroCardStack({ cards }: IntroCardStackProps): JSX.Element {
  return <SwipeableCardStack cards={cards} renderCard={(card) => <IntroCard {...card} />} />
}
