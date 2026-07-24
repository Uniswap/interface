import { EarnInlineError } from 'uniswap/src/features/earn/EarnInlineError'
import { render, screen } from 'uniswap/src/test/test-utils'

describe(EarnInlineError, () => {
  it('renders generic errors without a Learn more link', () => {
    render(<EarnInlineError message="Enter a larger amount." />)

    expect(screen.getByText('Enter a larger amount.')).toBeDefined()
    expect(screen.queryByText('Learn more')).toBeNull()
  })

  it('appends a Learn more link when given a help URL', () => {
    render(<EarnInlineError message="Transaction failed. Please try again." learnMoreUrl="https://help.uniswap.org" />)

    expect(screen.getByText('Learn more')).toBeDefined()
  })
})
