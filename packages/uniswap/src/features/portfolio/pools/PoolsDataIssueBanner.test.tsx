import { PoolsDataIssueBanner } from 'uniswap/src/features/portfolio/pools/PoolsDataIssueBanner'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { fireEvent, render, screen } from 'uniswap/src/test/test-utils'

describe('PoolsDataIssueBanner', () => {
  it('renders the outage message', () => {
    render(<PoolsDataIssueBanner message="Pools on X Layer currently unavailable" onDismiss={vi.fn()} />)
    expect(screen.getByText('Pools on X Layer currently unavailable')).toBeTruthy()
  })

  it('calls onDismiss when the close button is pressed', () => {
    const onDismiss = vi.fn()
    render(<PoolsDataIssueBanner message="msg" onDismiss={onDismiss} />)

    fireEvent.press(screen.getByTestId(TestID.PoolsDataIssueBannerDismiss))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('omits the close button when onDismiss is not provided', () => {
    render(<PoolsDataIssueBanner message="Pools balances currently unavailable" />)

    expect(screen.getByText('Pools balances currently unavailable')).toBeTruthy()
    expect(screen.queryByTestId(TestID.PoolsDataIssueBannerDismiss)).toBeNull()
  })
})
