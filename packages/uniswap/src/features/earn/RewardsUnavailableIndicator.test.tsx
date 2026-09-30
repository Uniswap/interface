import { TestID } from '@universe/test'
import { RewardsUnavailableIndicator } from 'uniswap/src/features/earn/RewardsUnavailableIndicator'
import { render, screen } from 'uniswap/src/test/test-utils'

describe('RewardsUnavailableIndicator', () => {
  it('renders the unavailable indicator', () => {
    render(<RewardsUnavailableIndicator />)

    expect(screen.getByTestId(TestID.RewardsUnavailable)).toBeDefined()
  })
})
