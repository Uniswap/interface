import React from 'react'
import { CollectionPreviewCard } from 'src/features/nfts/item/CollectionPreviewCard'
import { render } from 'src/test/test-utils'
import { NFT_COLLECTION } from 'uniswap/src/test/fixtures'

it('renders collection preview card', () => {
  const tree = render(<CollectionPreviewCard collection={NFT_COLLECTION} loading={false} onPress={(): null => null} />)
  expect(tree).toMatchSnapshot()
})
