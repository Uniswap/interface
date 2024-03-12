import React from 'react'
import { NFTTraitCard } from 'src/features/nfts/item/traits'
import { render } from 'src/test/test-utils'
import { NFTTrait } from 'wallet/src/test/gqlFixtures'

it('renders trait card', () => {
  const tree = render(<NFTTraitCard trait={NFTTrait} />)
  expect(tree).toMatchSnapshot()
})
