import React from 'react'
import { AccountDetails } from 'src/components/accounts/AccountDetails'
import { render } from 'src/test/test-utils'
import { account } from 'wallet/src/test/fixtures'

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
