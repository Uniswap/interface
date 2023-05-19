import { Trans } from '@lingui/macro'
import { NftStandard } from 'graphql/data/__generated__/types-and-hooks'
import { AddToBagIcon } from 'nft/components/icons'
import { useIsMobile } from 'nft/hooks'
import { GenieAsset } from 'nft/types'
import { useTheme } from 'styled-components/macro'

import { TableTabsKeys } from './DataPageTable'
import { TableContentComponent } from './TableContentComponent'
import { ContentRow, HeaderRow } from './TableRowComponent'

export const ListingsTableContent = ({ asset }: { asset: GenieAsset }) => {
  const isMobile = useIsMobile()
  const theme = useTheme()
  const headers = <HeaderRow type={TableTabsKeys.Listings} is1155={asset.tokenType === NftStandard.Erc1155} />
  const contentRows = (asset.sellorders || []).map((offer, index) => (
    <ContentRow
      key={'offer_' + index}
      content={offer}
      buttonCTA={isMobile ? <AddToBagIcon color={theme.textSecondary} /> : <Trans>Add to Bag</Trans>}
      is1155={asset.tokenType === NftStandard.Erc1155}
    />
  ))
  return <TableContentComponent headerRow={headers} contentRows={contentRows} type={TableTabsKeys.Offers} />
}
