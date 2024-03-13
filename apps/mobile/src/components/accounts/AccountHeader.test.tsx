import React from 'react'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { render } from 'src/test/test-utils'
import { ACCOUNT } from 'wallet/src/test/fixtures'
import { mockWalletPreloadedState } from 'wallet/src/test/mocks'

describe(AccountHeader, () => {
  it('renders without error', () => {
    const tree = render(<AccountHeader />, { preloadedState: mockWalletPreloadedState(ACCOUNT) })

    expect(tree.toJSON()).toMatchSnapshot()
  })
})
