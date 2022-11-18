import Column from 'components/Column'
import Row from 'components/Row'
import { Box } from 'nft/components/Box'
import { useIsMobile } from 'nft/hooks'
import { CollectionBannerLoading } from 'nft/pages/collection'
import { COLLECTION_BANNER_HEIGHT } from 'nft/pages/collection'
import { ScreenBreakpointsPaddings } from 'nft/pages/collection/index.css'
import styled from 'styled-components/macro'

import { ActivitySwitcherLoading } from './ActivitySwitcher'
import { CollectionNftsAndMenuLoading } from './CollectionNfts'
import { CollectionStatsLoading } from './CollectionStats'

const CollectionDescriptionSection = styled(Column)`
  ${ScreenBreakpointsPaddings}
`

const CollectionAssets = styled(Box)`
  ${ScreenBreakpointsPaddings}
`

const StyledColumn = styled(Column)`
  width: 100%;
`

const StyledRow = styled(Row)`
  gap: 24px;
  margin-bottom: 28px;
`

export const CollectionPageSkeleton = () => {
  const isMobile = useIsMobile()
  return (
    <StyledColumn>
      <Box width="full" height={`${COLLECTION_BANNER_HEIGHT}`}>
        <CollectionBannerLoading />
      </Box>
      <CollectionDescriptionSection>
        <CollectionStatsLoading isMobile={isMobile} />
        <StyledRow>{ActivitySwitcherLoading}</StyledRow>
      </CollectionDescriptionSection>
      <CollectionAssets>
        <CollectionNftsAndMenuLoading />
      </CollectionAssets>
    </StyledColumn>
  )
}
