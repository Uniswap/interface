import { AccountList } from 'src/components/accounts/AccountList'
import { cleanup, fireEvent, render, screen } from 'src/test/test-utils'
import { Locale } from 'uniswap/src/features/language/constants'
import { amounts, ON_PRESS_EVENT_PAYLOAD, portfolio } from 'uniswap/src/test/fixtures'
import { mockLocalizedFormatter } from 'uniswap/src/test/mocks'
import { createArray, queryResolvers } from 'uniswap/src/test/utils'
import { sanitizeAddressText } from 'uniswap/src/utils/addresses'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { ACCOUNT, readOnlyAccount, signerMnemonicAccount } from 'wallet/src/test/fixtures'

const tokensTotalDenominatedValue = amounts.md()
const { resolvers } = queryResolvers({
  portfolios: () => [portfolio({ tokensTotalDenominatedValue })],
})

const formatter = mockLocalizedFormatter(Locale.EnglishUnitedStates)

const defaultProps = {
  onPress: jest.fn(),
  onClose: jest.fn(),
}

// Skip entering animation of AccountIcon
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')

  Reanimated.Layout = { duration: (): object => ({}) }

  return Reanimated
})

describe(AccountList, () => {
  it('renders without error', async () => {
    const tree = render(<AccountList {...defaultProps} accounts={[ACCOUNT]} />, {
      resolvers,
    })

    expect(
      await screen.findByText(
        formatter.formatNumberOrString({
          value: tokensTotalDenominatedValue.value,
          type: NumberType.PortfolioBalance,
          currencyCode: 'usd',
        }),
      ),
    ).toBeDefined()
    expect(tree.toJSON()).toMatchSnapshot()
  })

  it('handles press on card items', async () => {
    const onPressSpy = jest.fn()
    render(<AccountList {...defaultProps} accounts={[ACCOUNT]} onPress={onPressSpy} />, {
      resolvers,
    })
    // go to success state
    expect(
      await screen.findByText(
        formatter.formatNumberOrString({
          value: tokensTotalDenominatedValue.value,
          type: NumberType.PortfolioBalance,
          currencyCode: 'usd',
        }),
      ),
    ).toBeDefined()

    fireEvent.press(screen.getByTestId(`account-item/${ACCOUNT.address}`), ON_PRESS_EVENT_PAYLOAD)

    expect(onPressSpy).toHaveBeenCalledTimes(1)
  })

  describe('signer accounts', () => {
    it('renders signer accounts section if there are signer accounts', () => {
      const signerAccounts = createArray(3, signerMnemonicAccount)
      render(<AccountList {...defaultProps} accounts={signerAccounts} />, {
        resolvers,
      })

      signerAccounts.forEach((account) => {
        const address = sanitizeAddressText(shortenAddress({ address: account.address, chars: 6 }))
        if (address) {
          expect(screen.queryByText(address)).toBeTruthy()
        }
      })
      cleanup()
    })

    it('does not render signer accounts section if there are no signer accounts', () => {
      render(<AccountList {...defaultProps} accounts={[readOnlyAccount()]} />, {
        resolvers,
      })

      expect(screen.queryByText('Your other wallets')).toBeFalsy()
      cleanup()
    })
  })

  describe('view only accounts', () => {
    it('renders view only accounts section if there are view only accounts', () => {
      const viewOnlyAccounts = createArray(3, readOnlyAccount)
      render(<AccountList {...defaultProps} accounts={viewOnlyAccounts} />, {
        resolvers,
      })

      expect(screen.queryByText('View-only wallets')).toBeTruthy()

      viewOnlyAccounts.forEach((account) => {
        const address = sanitizeAddressText(shortenAddress({ address: account.address, chars: 6 }))
        if (address) {
          expect(screen.queryByText(address)).toBeTruthy()
        }
      })
      cleanup()
    })

    it('does not render view only accounts section if there are no view only accounts', () => {
      render(<AccountList {...defaultProps} accounts={[signerMnemonicAccount()]} />, {
        resolvers,
      })

      expect(screen.queryByText('View-only wallets')).toBeFalsy()
      cleanup()
    })
  })
})
