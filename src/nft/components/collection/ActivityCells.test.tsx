import { TEST_NFT_ACTIVITY_EVENT } from 'test-utils/nft/fixtures'
import { render, screen } from 'test-utils/render'

import { BuyCell } from './ActivityCells'

// TODO: add snapshot matching test when VE works with snapshot testing
describe('BuyCell', () => {
  it('renders add to bag button', async () => {
    const { fragment } = render(
      <BuyCell
        event={TEST_NFT_ACTIVITY_EVENT}
        collectionName="Azuki"
        selectAsset={() => undefined}
        removeAsset={() => undefined}
        itemsInBag={[]}
        cartExpanded={false}
        toggleCart={() => undefined}
        isMobile={false}
        ethPriceInUSD={0}
      />
    )

    expect(fragment).toMatchSnapshot()
    expect(await screen.findByText(/Add to Bag/i)).toBeInTheDocument()
  })
})
