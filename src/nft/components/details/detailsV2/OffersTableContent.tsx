import { Trans } from '@lingui/macro'
import { NftStandard } from 'graphql/data/__generated__/types-and-hooks'
import { useIsMobile } from 'nft/hooks'
import { GenieAsset } from 'nft/types'
import { Check } from 'react-feather'
import { useTheme } from 'styled-components/macro'
import { TEST_OFFER } from 'test-utils/nft/fixtures'

import { TableTabsKeys } from './DataPageTable'
import { TableContentComponent } from './TableContentComponent'
import { ContentRow, HeaderRow } from './TableRowComponent'

export const OffersTableContent = ({ asset }: { asset: GenieAsset }) => {
  // TODO(NFT-1189) Replace with real offer data when BE supports
  const mockOffers = new Array(11).fill(TEST_OFFER)
  const isMobile = useIsMobile()
  const theme = useTheme()
  const headers = <HeaderRow type={TableTabsKeys.Offers} is1155={asset.tokenType === NftStandard.Erc1155} />
  const contentRows = mockOffers.map((offer, index) => (
    <ContentRow
      key={'offer_' + index}
      content={offer}
      buttonCTA={isMobile ? <Check color={theme.textSecondary} height="20px" width="20px" /> : <Trans>Accept</Trans>}
      is1155={asset.tokenType === NftStandard.Erc1155}
    />
  ))
  return <TableContentComponent headerRow={headers} contentRows={contentRows} type={TableTabsKeys.Offers} />
}
