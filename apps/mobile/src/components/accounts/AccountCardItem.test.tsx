import { AccountCardItem } from 'src/components/accounts/AccountCardItem'
import { fireEvent, render, screen } from 'src/test/test-utils'
import { ON_PRESS_EVENT_PAYLOAD, SAMPLE_SEED_ADDRESS_1 } from 'uniswap/src/test/fixtures'

describe('AccountCardItem', () => {
  const defaultProps = {
    address: SAMPLE_SEED_ADDRESS_1,
    isPortfolioValueLoading: false,
    portfolioValue: 100,
    isViewOnly: false,
    onPress: vi.fn(),
    onClose: vi.fn(),
  }

  it('renders correctly', () => {
    const tree = render(<AccountCardItem {...defaultProps} />)

    expect(tree).toMatchSnapshot()
  })

  it('calls onPress when address is pressed', () => {
    const onPress = vi.fn()
    render(<AccountCardItem {...defaultProps} onPress={onPress} />)

    const address = screen.getByTestId(`account-item/${SAMPLE_SEED_ADDRESS_1}`)
    fireEvent.press(address, ON_PRESS_EVENT_PAYLOAD)

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  describe('portfolio value', () => {
    it('displays loading shimmmer when portfolio value is loading', () => {
      const { rerender } = render(
        <AccountCardItem {...defaultProps} isPortfolioValueLoading={true} portfolioValue={undefined} />,
      )

      // Select shimmer placeholder because the actual shimmer is rendered after onLayout
      // is fired and this logic is not a part of this test
      expect(screen.queryByTestId('shimmer')).toBeTruthy()

      rerender(<AccountCardItem {...defaultProps} isPortfolioValueLoading={false} portfolioValue={undefined} />)

      expect(screen.queryByTestId('shimmer')).toBeFalsy()
    })

    it('shows current portfolio value when available', () => {
      render(<AccountCardItem {...defaultProps} portfolioValue={100} />)

      expect(screen.queryByText('$100.00')).toBeTruthy()
    })

    it('shows placeholder text when portfolio value is not available', () => {
      render(<AccountCardItem {...defaultProps} portfolioValue={undefined} />)

      expect(screen.queryByText('common.text.notAvailable')).toBeTruthy()
    })

    // Cache-fallback behavior: when portfolioValue prop is undefined, PortfolioValue does a
    // synchronous Apollo cache.readQuery to recover a previously-known value. That path is
    // exercised in integration (parent AccountList writes the cache via its own query); a
    // standalone unit test would require pre-populating the test's Apollo cache, which the
    // mobile test harness does not currently expose.
  })

  describe('view only accounts', () => {
    it('renders view only badge when account is view only', () => {
      render(<AccountCardItem {...defaultProps} isViewOnly={true} />)

      const badge = screen.queryByTestId('account-icon/view-only-badge')

      expect(badge).toBeTruthy()
    })

    it('does not render view only badge when account is not view only', () => {
      render(<AccountCardItem {...defaultProps} isViewOnly={false} />)

      const badge = screen.queryByTestId('account-icon/view-only-badge')

      expect(badge).toBeFalsy()
    })
  })
})
