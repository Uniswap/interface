import { Flex } from 'ui/src'
import { IntroCardStack } from 'wallet/src/components/introCards/IntroCardStack'
import { useSharedIntroCards } from 'wallet/src/components/introCards/useSharedIntroCards'

export function HomeIntroCardStack(): JSX.Element | null {
  const cards = useSharedIntroCards({
    navigateToUnitagClaim: () => {},
    navigateToUnitagIntro: () => {},
  })

  if (!cards.length) {
    return null
  }

  return (
    <Flex py="$spacing4">
      <IntroCardStack cards={cards} />
    </Flex>
  )
}
