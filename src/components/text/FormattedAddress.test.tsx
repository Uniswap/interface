import React from 'react'
import { FormattedAddress } from 'src/components/text/FormattedAddress'
import { account } from 'src/test/fixtures'
import { renderWithTheme } from 'src/test/render'

it('renders a FormattedAddress without a name', () => {
  const tree = renderWithTheme(<FormattedAddress address={account.address} />)
  expect(tree).toMatchSnapshot()
})

it('renders a FormattedAddress with a name', () => {
  const tree = renderWithTheme(<FormattedAddress address={account.address} name={account.name} />)
  expect(tree).toMatchSnapshot()
})
