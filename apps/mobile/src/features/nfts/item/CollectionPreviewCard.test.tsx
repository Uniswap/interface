import React from 'react'
import { CollectionPreviewCard } from 'src/features/nfts/item/CollectionPreviewCard'
import { TopNFTCollections } from 'src/test/gqlFixtures'
import { render } from 'src/test/test-utils'

it('renders collection preview card', () => {
  const tree = render(
    <CollectionPreviewCard
      collection={TopNFTCollections[0]}
      loading={false}
      onPress={(): null => null}
    />
  )
  expect(tree).toMatchSnapshot()
})
