import { AnimatedBox, Box } from 'nft/components/Box'
import { CollectionStats } from 'nft/components/collection/CollectionStats'
import { Column, Row } from 'nft/components/Flex'
import { CollectionProps } from 'nft/pages/collection/common'
import * as styles from 'nft/pages/collection/common.css'
import { ActivitySwitcher } from 'nft/pages/collection/Components'

export const CollectionMobile = ({ collectionStats, isActivityToggled }: CollectionProps) => {
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

      <Row paddingLeft="32" paddingRight="32">
        <CollectionStats stats={collectionStats} isMobile={true} />
      </Row>
      <Row paddingLeft="32" paddingRight="32">
        <ActivitySwitcher showActivity={isActivityToggled} toggleActivity={() => undefined} />
      </Row>
      <Row alignItems="flex-start" position="relative" paddingLeft="32" paddingRight="32">
        {/* // @ts-ignore */}
        <AnimatedBox width="full">CollectionNfts</AnimatedBox>
      </Row>
    </Column>
  )
}
