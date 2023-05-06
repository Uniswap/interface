import { Trans } from '@lingui/macro'
import { GenieAsset } from 'nft/types'
import { TEST_SELL_ORDER } from 'test-utils/nft/fixtures'

import { TableTabsKeys } from './DataPageTable'
import { ContentRow, HeaderRow, TableContentComponent } from './TableContentComponent'

export const ListingsTableContent = ({ asset }: { asset: GenieAsset }) => {
  // TODO(NFT-1189) Replace with real offer data when BE supports
  const mockListings = new Array(6).fill(TEST_SELL_ORDER)
  const headers = <HeaderRow type={TableTabsKeys.Listings} />
  const contentRows = mockListings.map((offer, index) => (
    <ContentRow key={'offer_' + index} content={offer} buttonCTA={<Trans>Add to Bag</Trans>} />
  ))
  return <TableContentComponent headerRow={headers} contentRows={contentRows} type={TableTabsKeys.Offers} />
}
