import React from 'react'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { render } from 'src/test/test-utils'
import { mockWalletPreloadedState } from 'wallet/src/test/fixtures'

describe(AccountHeader, () => {
  it('renders without error', () => {
    const tree = render(<AccountHeader />, { preloadedState: mockWalletPreloadedState })

    expect(tree.toJSON()).toMatchSnapshot()
  })
})
