import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { useIsMobile } from 'nft/hooks'
import { CollectionBannerLoading } from 'nft/pages/collection'
import { COLLECTION_BANNER_HEIGHT } from 'nft/pages/collection'
import * as styles from 'nft/pages/collection/index.css'
import styled from 'styled-components/macro'

import { ActivitySwitcherLoading } from './ActivitySwitcher'
import { CollectionNftsAndMenuLoading } from './CollectionNfts'
import { CollectionStatsLoading } from './CollectionStats'

const CollectionDescriptionSection = styled(Column)`
  ${styles.ScreenBreakpointsPaddings}
`

const CollectionAssets = styled(Box)`
  ${styles.ScreenBreakpointsPaddings}
`

export const CollectionPageSkeleton = () => {
  const isMobile = useIsMobile()
  return (
    <Column width="full">
      <Box width="full" height={`${COLLECTION_BANNER_HEIGHT}`}>
        <CollectionBannerLoading />
      </Box>
      <CollectionDescriptionSection>
        <CollectionStatsLoading isMobile={isMobile} />
        <Row gap="24" marginBottom="28">
          {ActivitySwitcherLoading}
        </Row>
      </CollectionDescriptionSection>
      <CollectionAssets>
        <CollectionNftsAndMenuLoading />
      </CollectionAssets>
    </Column>
  )
}
