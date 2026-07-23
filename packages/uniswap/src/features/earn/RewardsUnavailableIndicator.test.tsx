import { RewardsUnavailableIndicator } from 'uniswap/src/features/earn/RewardsUnavailableIndicator'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { render, screen } from 'uniswap/src/test/test-utils'

describe('RewardsUnavailableIndicator', () => {
  it('renders the unavailable indicator', () => {
    render(<RewardsUnavailableIndicator />)

    expect(screen.getByTestId(TestID.RewardsUnavailable)).toBeDefined()
  })
})
