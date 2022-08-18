import { AnimatedBox, Box } from 'nft/components/Box'
import { CollectionStats } from 'nft/components/collection/CollectionStats'
import { Column, Row } from 'nft/components/Flex'
import { CollectionProps } from 'nft/pages/collection/common'
import * as styles from 'nft/pages/collection/common.css'

export const CollectionDesktop = ({ collectionStats }: CollectionProps) => {
  return (
    <Column width="full">
      <Box width="full" height="160">
        <Box
          as="img"
          maxHeight="full"
          width="full"
          src={collectionStats?.bannerImageUrl}
          className={`${styles.bannerImage}`}
        />
      </Box>

      {collectionStats && (
        <Row paddingLeft="32" paddingRight="32">
          <CollectionStats stats={collectionStats} isMobile={false} />
        </Row>
      )}
      <Row alignItems="flex-start" position="relative" paddingLeft="32" paddingRight="32">
        <AnimatedBox width="full">CollectionNfts</AnimatedBox>
      </Row>
    </Column>
  )
}
