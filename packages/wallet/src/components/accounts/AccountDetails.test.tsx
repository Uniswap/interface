import { AccountDetails } from 'wallet/src/components/accounts/AccountDetails'
import { account } from 'wallet/src/test/fixtures'
import { render } from 'wallet/src/test/test-utils'

describe(AccountDetails, () => {
  it('renders without error', () => {
    const tree = render(<AccountDetails address={account.address} iconSize={50} />)

    expect(tree.toJSON()).toMatchSnapshot()
  })

  it('renders without error with chevron', () => {
    const tree = render(<AccountDetails chevron address={account.address} iconSize={50} />)

    expect(tree.toJSON()).toMatchSnapshot()
  })
})
