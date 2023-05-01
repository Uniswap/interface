import { TEST_NFT_ASSET } from 'test-utils/nft/fixtures'
import { render } from 'test-utils/render'

import { DataPageTraits } from './DataPageTraits'

it('data page trait component does not load with asset with no traits', () => {
  const { asFragment } = render(<DataPageTraits traits={TEST_NFT_ASSET.traits ?? []} />)
  expect(asFragment()).toMatchSnapshot()
})

// TODO(NFT-1189): add test for trait component with asset with traits when rarity is not randomly generated
// while rarities are randomly generated, snapshots will never match
