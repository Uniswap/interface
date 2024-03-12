import { AccountDetails } from 'wallet/src/components/accounts/AccountDetails'
import { account } from 'wallet/src/test/fixtures'
import { renderWithProviders } from 'wallet/src/test/render'

describe(AccountDetails, () => {
  it('renders without error', () => {
    const tree = renderWithProviders(<AccountDetails address={account.address} iconSize={50} />)

    expect(tree.toJSON()).toMatchSnapshot()
  })

  it('renders without error with chevron', () => {
    const tree = renderWithProviders(
      <AccountDetails chevron address={account.address} iconSize={50} />
    )

    expect(tree.toJSON()).toMatchSnapshot()
  })
})
