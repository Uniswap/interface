import { AccountCardItem } from 'src/components/accounts/AccountCardItem'
import { preloadedMobileState } from 'src/test/fixtures'
import { fireEvent, getNearestFiberProp, render, screen } from 'src/test/test-utils'
import { ON_PRESS_EVENT_PAYLOAD, SAMPLE_SEED_ADDRESS_1 } from 'uniswap/src/test/fixtures'
import { ACCOUNT, readOnlyAccount } from 'wallet/src/test/fixtures'

interface MenuAction {
  title: string
}

function getMenuActionTitles(): string[] {
  const accountItem = screen.getByTestId(`account-item/${SAMPLE_SEED_ADDRESS_1}`)
  const menuActions = getNearestFiberProp(accountItem, 'actions') as MenuAction[]

  return menuActions.map((action) => action.title)
}

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
    it('displays loading placeholder when portfolio value is loading', () => {
      const { rerender } = render(
        <AccountCardItem {...defaultProps} isPortfolioValueLoading={true} portfolioValue={undefined} />,
      )

      // The shimmer overlay mounts only after onLayout, which react-native-web never fires in jsdom; assert the placeholder bar instead.
      expect(screen.queryByTestId('text-placeholder')).toBeTruthy()

      rerender(<AccountCardItem {...defaultProps} isPortfolioValueLoading={false} portfolioValue={undefined} />)

      expect(screen.queryByTestId('text-placeholder')).toBeFalsy()
    })

    it('shows current portfolio value when available', () => {
      render(<AccountCardItem {...defaultProps} portfolioValue={100} />)

      expect(screen.queryByText('$100.00')).toBeTruthy()
    })

    it('shows placeholder text when portfolio value is not available', () => {
      render(<AccountCardItem {...defaultProps} portfolioValue={undefined} />)

      expect(screen.queryByText('common.text.notAvailable')).toBeTruthy()
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

    it('only shows copy and remove actions', () => {
      const account = readOnlyAccount({ address: SAMPLE_SEED_ADDRESS_1 })

      render(<AccountCardItem {...defaultProps} isViewOnly={true} />, {
        preloadedState: preloadedMobileState({ account }),
      })

      expect(getMenuActionTitles()).toEqual(['account.wallet.action.copy', 'account.wallet.button.remove'])
    })
  })

  describe('signer accounts', () => {
    it('keeps edit and connection management actions', () => {
      render(<AccountCardItem {...defaultProps} />, {
        preloadedState: preloadedMobileState({ account: ACCOUNT }),
      })

      expect(getMenuActionTitles()).toEqual([
        'account.wallet.action.copy',
        'settings.setting.wallet.action.editLabel',
        'account.wallet.action.manageConnections',
        'account.wallet.button.remove',
      ])
    })
  })
})
