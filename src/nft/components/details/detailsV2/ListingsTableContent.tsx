import { Trans } from '@lingui/macro'
import { NftStandard } from 'graphql/data/__generated__/types-and-hooks'
import { GenieAsset } from 'nft/types'

import { TableTabsKeys } from './DataPageTable'
import { ContentRow, HeaderRow, TableContentComponent } from './TableContentComponent'

export const ListingsTableContent = ({ asset }: { asset: GenieAsset }) => {
  const headers = <HeaderRow type={TableTabsKeys.Listings} is1155={asset.tokenType === NftStandard.Erc1155} />
  const contentRows = (asset.sellorders || []).map((offer, index) => (
    <ContentRow
      key={'offer_' + index}
      content={offer}
      buttonCTA={<Trans>Add to Bag</Trans>}
      is1155={asset.tokenType === NftStandard.Erc1155}
    />
  ))
  return <TableContentComponent headerRow={headers} contentRows={contentRows} type={TableTabsKeys.Offers} />
}
