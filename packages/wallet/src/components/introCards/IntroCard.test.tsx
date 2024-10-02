import { Wallet } from 'ui/src/components/icons'
import { CardType, IntroCard, IntroCardProps } from 'wallet/src/components/introCards/IntroCard'
import { render, screen } from 'wallet/src/test/test-utils'

describe(IntroCard, () => {
  it('should render the passed values', () => {
    const props = {
      Icon: Wallet,
      title: 'Test title',
      description: 'Test description',
      cardType: CardType.Required,
    } satisfies IntroCardProps

    render(<IntroCard {...props} />)
    expect(screen.findByText(props.title)).toBeTruthy()
    expect(screen.findByText(props.description)).toBeTruthy()
  })
})
