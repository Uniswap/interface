import Column from 'components/Column'
import Row from 'components/Row'
import { useBag, useIsMobile } from 'nft/hooks'
import { BAG_WIDTH, BannerWrapper, CollectionBannerLoading } from 'nft/pages/collection'
import { ScreenBreakpointsPaddings } from 'nft/pages/collection/index.css'
import styled from 'styled-components/macro'

import { ActivitySwitcherLoading } from './ActivitySwitcher'
import { CollectionNftsAndMenuLoading } from './CollectionNfts'
import { CollectionStatsLoading } from './CollectionStats'

const CollectionDescriptionSection = styled(Column)`
  ${ScreenBreakpointsPaddings}
`

const StyledColumn = styled(Column)<{ isBagExpanded: boolean }>`
  width: ${({ isBagExpanded }) => (isBagExpanded ? `calc(100% - ${BAG_WIDTH}px)` : '100%')};
  align-self: start;
`

const StyledRow = styled(Row)`
  gap: 24px;
  margin-bottom: 28px;
`

export const CollectionPageSkeleton = () => {
  const isBagExpanded = useBag((s) => s.bagExpanded)
  const isMobile = useIsMobile()

  return (
    <StyledColumn isBagExpanded={isBagExpanded}>
      <BannerWrapper>
        <CollectionBannerLoading />
      </BannerWrapper>
      <CollectionDescriptionSection>
        <CollectionStatsLoading isMobile={isMobile} />
        <StyledRow>{ActivitySwitcherLoading}</StyledRow>
      </CollectionDescriptionSection>
      <CollectionNftsAndMenuLoading />
    </StyledColumn>
  )
}
