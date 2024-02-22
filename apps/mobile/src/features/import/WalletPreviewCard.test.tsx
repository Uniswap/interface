import React from 'react'
import WalletPreviewCard from 'src/features/import/WalletPreviewCard'
import { render } from 'src/test/test-utils'
import { SAMPLE_SEED_ADDRESS_1 } from 'wallet/src/test/fixtures'

it('renders wallet preview card', () => {
  const tree = render(
    <WalletPreviewCard selected address={SAMPLE_SEED_ADDRESS_1} onSelect={(): null => null} />
  )
  expect(tree).toMatchSnapshot()
})
