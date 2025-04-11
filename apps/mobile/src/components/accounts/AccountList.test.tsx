import { AccountList } from 'src/components/accounts/AccountList'
import { cleanup, fireEvent, render, screen } from 'src/test/test-utils'
import { Locale } from 'uniswap/src/features/language/constants'
import { ON_PRESS_EVENT_PAYLOAD, amounts, portfolio } from 'uniswap/src/test/fixtures'
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

describe(AccountList, () => {
  it('renders without error', async () => {
    const tree = render(<AccountList accounts={[ACCOUNT]} onPress={jest.fn()} />, { resolvers })

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
    render(<AccountList accounts={[ACCOUNT]} onPress={onPressSpy} />, {
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
      render(<AccountList accounts={signerAccounts} onPress={jest.fn()} />, { resolvers })

      signerAccounts.forEach((account) => {
        const address = sanitizeAddressText(shortenAddress(account.address))
        if (address) {
          expect(screen.queryByText(address)).toBeTruthy()
        }
      })
      cleanup()
    })

    it('does not render signer accounts section if there are no signer accounts', () => {
      render(<AccountList accounts={[readOnlyAccount()]} onPress={jest.fn()} />, { resolvers })

      expect(screen.queryByText('Your other wallets')).toBeFalsy()
      cleanup()
    })
  })

  describe('view only accounts', () => {
    it('renders view only accounts section if there are view only accounts', () => {
      const viewOnlyAccounts = createArray(3, readOnlyAccount)
      render(<AccountList accounts={viewOnlyAccounts} onPress={jest.fn()} />, { resolvers })

      expect(screen.queryByText('View-only wallets')).toBeTruthy()

      viewOnlyAccounts.forEach((account) => {
        const address = sanitizeAddressText(shortenAddress(account.address))
        if (address) {
          expect(screen.queryByText(address)).toBeTruthy()
        }
      })
      cleanup()
    })

    it('does not render view only accounts section if there are no view only accounts', () => {
      render(<AccountList accounts={[signerMnemonicAccount()]} onPress={jest.fn()} />, {
        resolvers,
      })

      expect(screen.queryByText('View-only wallets')).toBeFalsy()
      cleanup()
    })
  })
})
