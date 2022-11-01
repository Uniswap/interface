import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { useIsMobile } from 'nft/hooks'
import { CollectionBannerLoading } from 'nft/pages/collection'

import { ActivitySwitcherLoading } from './ActivitySwitcher'
import { CollectionNftsAndMenuLoading } from './CollectionNfts'
import { CollectionStatsLoading } from './CollectionStats'

export const CollectionPageSkeleton = () => {
  const isMobile = useIsMobile()
  return (
    <Column width="full">
      <Box width="full" height="160">
        <CollectionBannerLoading />
      </Box>
      <Column paddingX="32">
        <CollectionStatsLoading isMobile={isMobile} />
        <Row gap="24" marginBottom="28">
          {ActivitySwitcherLoading}
        </Row>
      </Column>
      <Box paddingX="48">
        <CollectionNftsAndMenuLoading />
      </Box>
    </Column>
  )
}
