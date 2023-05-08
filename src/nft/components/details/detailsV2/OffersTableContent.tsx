import { Trans } from '@lingui/macro'
import { NftStandard } from 'graphql/data/__generated__/types-and-hooks'
import { GenieAsset } from 'nft/types'
import { TEST_OFFER } from 'test-utils/nft/fixtures'

import { TableTabsKeys } from './DataPageTable'
import { ContentRow, HeaderRow, TableContentComponent } from './TableContentComponent'

export const OffersTableContent = ({ asset }: { asset: GenieAsset }) => {
  // TODO(NFT-1189) Replace with real offer data when BE supports
  const mockOffers = new Array(6).fill(TEST_OFFER)
  const headers = <HeaderRow type={TableTabsKeys.Offers} is1155={asset.tokenType === NftStandard.Erc1155} />
  const contentRows = mockOffers.map((offer, index) => (
    <ContentRow
      key={'offer_' + index}
      content={offer}
      buttonCTA={<Trans>Accept</Trans>}
      is1155={asset.tokenType === NftStandard.Erc1155}
    />
  ))
  return <TableContentComponent headerRow={headers} contentRows={contentRows} type={TableTabsKeys.Offers} />
}
