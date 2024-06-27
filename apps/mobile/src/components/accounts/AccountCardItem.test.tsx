import { fireEvent, render, screen, waitFor } from 'src/test/test-utils'
import * as hooks from 'wallet/src/features/accounts/hooks'
import {
  ON_PRESS_EVENT_PAYLOAD,
  SAMPLE_SEED_ADDRESS_1,
  amount,
  portfolio,
} from 'wallet/src/test/fixtures'
import { queryResolvers } from 'wallet/src/test/utils'
import { AccountCardItem } from './AccountCardItem'

describe(AccountCardItem, () => {
  beforeEach(() => {
    jest.spyOn(hooks, 'useAccountList').mockReturnValue({
      data: undefined,
      loading: false,
      networkStatus: 7,
      refetch: jest.fn(),
      startPolling: jest.fn(),
      stopPolling: jest.fn(),
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const defaultProps = {
    address: SAMPLE_SEED_ADDRESS_1,
    isPortfolioValueLoading: false,
    portfolioValue: 100,
    isViewOnly: false,
    onPress: jest.fn(),
  }

  it('renders correctly', () => {
    const tree = render(<AccountCardItem {...defaultProps} />)

    expect(tree).toMatchSnapshot()
  })

  it('calls onPress when address is pressed', () => {
    const onPress = jest.fn()
    render(<AccountCardItem {...defaultProps} onPress={onPress} />)

    const address = screen.getByTestId(`account-item/${SAMPLE_SEED_ADDRESS_1}`)
    fireEvent.press(address, ON_PRESS_EVENT_PAYLOAD)

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  describe('portfolio value', () => {
    it('displays loading shimmmer when portfolio value is loading', () => {
      const { rerender } = render(
        <AccountCardItem
          {...defaultProps}
          isPortfolioValueLoading={true}
          portfolioValue={undefined}
        />
      )

      // Select shimmer placeholder because the actual shimmer is rendered after onLayout
      // is fired and this logic is not a part of this test
      expect(screen.queryByTestId('shimmer-placeholder')).toBeTruthy()

      rerender(
        <AccountCardItem
          {...defaultProps}
          isPortfolioValueLoading={false}
          portfolioValue={undefined}
        />
      )

      expect(screen.queryByTestId('shimmer-placeholder')).toBeFalsy()
    })

    it('shows current portfolio value when available', () => {
      render(<AccountCardItem {...defaultProps} portfolioValue={100} />)

      expect(screen.queryByText('$100.00')).toBeTruthy()
    })

    it('shows placeholder text when portfolio value is not available', () => {
      render(<AccountCardItem {...defaultProps} portfolioValue={undefined} />)

      expect(screen.queryByText('N/A')).toBeTruthy()
    })

    it('shows cached portfolio value when not provided explicitly in props', async () => {
      // We don't want to use the mocked query response for this test as we want to
      // test if the cached value (returned by the query) is used when value is not provided
      jest.restoreAllMocks()
      const { resolvers: resolversWithPortfolioValue } = queryResolvers({
        portfolios: () => [portfolio({ tokensTotalDenominatedValue: amount({ value: 200 }) })],
      })
      render(<AccountCardItem {...defaultProps} portfolioValue={undefined} />, {
        resolvers: resolversWithPortfolioValue,
      })

      await waitFor(() => {
        expect(screen.queryByText('$200.00')).toBeTruthy()
      })
    })
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
