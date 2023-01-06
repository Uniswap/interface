import React from 'react'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { mockWalletPreloadedState } from 'src/test/fixtures'
import { render } from 'src/test/test-utils'

describe(AccountHeader, () => {
  it('renders without error', () => {
    const tree = render(<AccountHeader />, { preloadedState: mockWalletPreloadedState })

    expect(tree.toJSON()).toMatchSnapshot()
  })
})
