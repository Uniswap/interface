import { SwipeableCardStackProps } from 'ui/src/components/swipeablecards/props'
import { PlatformSplitStubError } from 'utilities/src/errors'

export function SwipeableCardStack<T>(_props: SwipeableCardStackProps<T>): JSX.Element {
  throw new PlatformSplitStubError('SwipeableCardStack')
}
