import React from 'react'
import { WalletLoader } from 'src/components/loading/WalletLoader'
import { render } from 'src/test/test-utils'

it('renders wallet loader', () => {
  const tree = render(<WalletLoader opacity={1} />)
  expect(tree).toMatchSnapshot()
})
