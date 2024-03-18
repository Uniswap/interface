import { AccountList } from 'src/components/accounts/AccountList'
import { cleanup, fireEvent, render, screen } from 'src/test/test-utils'
import { NumberType } from 'utilities/src/format/types'
import {
  ACCOUNT,
  ON_PRESS_EVENT_PAYLOAD,
  amounts,
  portfolio,
  readOnlyAccount,
  signerMnemonicAccount,
} from 'wallet/src/test/fixtures'
import { mockLocalizedFormatter } from 'wallet/src/test/mocks'
import { createArray, queryResolvers } from 'wallet/src/test/utils'
import { sanitizeAddressText, shortenAddress } from 'wallet/src/utils/addresses'

const tokensTotalDenominatedValue = amounts.md()
const { resolvers } = queryResolvers({
  portfolios: () => [portfolio({ tokensTotalDenominatedValue })],
})

describe(AccountList, () => {
  afterEach(cleanup)

  it('renders without error', async () => {
    const tree = render(<AccountList accounts={[ACCOUNT]} onPress={jest.fn()} />, { resolvers })

    expect(
      await screen.findByText(
        mockLocalizedFormatter.formatNumberOrString({
          value: tokensTotalDenominatedValue.value,
          type: NumberType.PortfolioBalance,
          currencyCode: 'usd',
        })
      )
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
        mockLocalizedFormatter.formatNumberOrString({
          value: tokensTotalDenominatedValue.value,
          type: NumberType.PortfolioBalance,
          currencyCode: 'usd',
        })
      )
    ).toBeDefined()

    fireEvent.press(screen.getByTestId(`account-item/${ACCOUNT.address}`), ON_PRESS_EVENT_PAYLOAD)

    expect(onPressSpy).toHaveBeenCalledTimes(1)
  })

  describe('signer accounts', () => {
    it('renders signer accounts section if there are signer accounts', () => {
      const signerAccounts = createArray(3, signerMnemonicAccount)
      render(<AccountList accounts={signerAccounts} onPress={jest.fn()} />, { resolvers })

      expect(screen.queryByText('Your other wallets')).toBeTruthy()

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

      expect(screen.queryByText('View only wallets')).toBeTruthy()

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

      expect(screen.queryByText('View only wallets')).toBeFalsy()
      // cleanup()
    })
  })
})
