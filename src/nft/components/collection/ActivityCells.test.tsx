import { TEST_NFT_ACTIVITY_EVENT } from 'test-utils/constants'
import { render, screen } from 'test-utils/render'

import { BuyCell } from './ActivityCells'

describe('BuyCell', () => {
  it('renders add to bag button', async () => {
    const { asFragment } = render(
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
    expect(asFragment()).toMatchSnapshot()
    expect(await screen.findByText(/Add to Bag/i)).toBeInTheDocument()
  })
})
