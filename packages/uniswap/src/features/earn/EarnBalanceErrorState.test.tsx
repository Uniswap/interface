import { EarnBalanceErrorState } from 'uniswap/src/features/earn/EarnBalanceErrorState'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { fireEvent, render, screen } from 'uniswap/src/test/test-utils'

describe('EarnBalanceErrorState', () => {
  it('renders the error message and calls onRetry when Try again is pressed', () => {
    const onRetry = vi.fn()
    render(<EarnBalanceErrorState onRetry={onRetry} />)

    expect(screen.getByTestId(TestID.EarnBalanceError)).toBeDefined()

    fireEvent.press(screen.getByTestId(TestID.EarnBalanceErrorRetry), ON_PRESS_EVENT_PAYLOAD)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
