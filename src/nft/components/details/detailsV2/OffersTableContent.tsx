import { HomeSearchIcon } from 'nft/components/icons'
import { GenieAsset } from 'nft/types'
import { useMemo } from 'react'

import { TableTabsKeys } from './DataPageTable'
import { TableCell, TableContentContainer } from './TableContentComponent'

const OffersTableHeaders: TableCell[] = [
  {
    key: 'offerIcon',
    content: <HomeSearchIcon />,
  },
]

export const OffersTableContent = ({ asset }: { asset: GenieAsset }) => {
  // TODO(NFT-1189) Replace with real offer data when BE supports
  const mockAssetOffersNum = 6
  const offersRow = useMemo(() => {
    return Array.from({ length: mockAssetOffersNum }, (_, index) => {})
  }, [])
  return (
    <TableContentContainer headerRow={OffersTableHeaders} contentRows={[]} key={TableTabsKeys.Offers}>
      Offers Content
    </TableContentContainer>
  )
}
