import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { useIsMobile } from 'hooks/screenSize/useIsMobile'
import styled from 'lib/styled-components'
import { BAG_WIDTH, XXXL_BAG_WIDTH } from 'nft/components/bag/Bag'
import { ActivitySwitcherLoading } from 'nft/components/collection/ActivitySwitcher'
import { CollectionNftsAndMenuLoading } from 'nft/components/collection/CollectionNfts'
import { CollectionStatsLoading } from 'nft/components/collection/CollectionStats'
import { breakpointPaddingsCss } from 'nft/css/breakpoints'
import { useBag } from 'nft/hooks'
import { BannerWrapper, CollectionBannerLoading } from 'nft/pages/collection'

const CollectionDescriptionSection = styled(Column)`
  ${breakpointPaddingsCss}
`

const StyledColumn = styled(Column)<{ isBagExpanded: boolean }>`
  width: ${({ isBagExpanded }) => (isBagExpanded ? `calc(100% - ${BAG_WIDTH + 16}px)` : '100%')};
  align-self: start;

  @media only screen and (min-width: ${({ theme }) => `${theme.breakpoint.xxxl}px`}) {
    width: ${({ isBagExpanded }) => (isBagExpanded ? `calc(100% - ${XXXL_BAG_WIDTH + 16}px)` : '100%')};
  }
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
