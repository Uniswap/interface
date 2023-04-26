import React from 'react'
import WalletPreviewCard from 'src/features/import/WalletPreviewCard'
import { ACCOUNT_ADDRESS_ONE } from 'src/test/fixtures'
import { render } from 'src/test/test-utils'

it('renders wallet preview card', () => {
  const tree = render(
    <WalletPreviewCard selected address={ACCOUNT_ADDRESS_ONE} onSelect={(): null => null} />
  )
  expect(tree).toMatchSnapshot()
})
