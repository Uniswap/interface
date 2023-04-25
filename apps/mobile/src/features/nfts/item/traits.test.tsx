import React from 'react'
import { NFTTraitCard } from 'src/features/nfts/item/traits'
import { NFTTrait } from 'src/test/gqlFixtures'
import { render } from 'src/test/test-utils'

it('renders trait card', () => {
  const tree = render(<NFTTraitCard trait={NFTTrait} />)
  expect(tree).toMatchSnapshot()
})
