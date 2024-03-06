import React from 'react'
import { NFTTraitCard } from 'src/features/nfts/item/traits'
import { render } from 'src/test/test-utils'
import { NFT_ASSET_TRAIT } from 'wallet/src/test/fixtures'

it('renders trait card', () => {
  const tree = render(<NFTTraitCard trait={NFT_ASSET_TRAIT} />)
  expect(tree).toMatchSnapshot()
})
