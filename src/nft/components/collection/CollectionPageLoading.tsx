import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { useIsMobile } from 'nft/hooks'
import { DEFAULT_ASSET_QUERY_AMOUNT } from 'nft/pages/collection'
import * as styles from 'nft/pages/collection/index.css'

import { CollectionAssetLoading } from './CollectionAssetLoading'
import { assetList } from './CollectionNfts.css'
import { CollectionStatsLoading } from './CollectionStats'

export const CollectionNftsLoading = <>{new Array(DEFAULT_ASSET_QUERY_AMOUNT).fill(<CollectionAssetLoading />)}</>

export const CollectionPageLoading = () => {
  const isMobile = useIsMobile()
  return (
    <Column width="full">
      <Box width="full" height="160">
        <Box height="full" width="full" className={styles.loadingBanner} />
      </Box>
      <Column paddingX="32">
        <CollectionStatsLoading isMobile={isMobile} />

        {/* <ActivitySwitcher
          showActivity={isActivityToggled}
          toggleActivity={() => {
            isFiltersExpanded && setFiltersExpanded(false)
            toggleActivity()
          }}
        /> NEEd Loading vals */}
      </Column>
      <Row alignItems="flex-start" position="relative" paddingX="48" width="full">
        <Box position="sticky" top="72" width="0">
          {/* {isFiltersExpanded && <Filters traitsByGroup={collectionStats?.traits ?? {}} />} TODO add traits */}
        </Box>
        <Box width="full" className={assetList}>
          {CollectionNftsLoading}
        </Box>
      </Row>
    </Column>
  )
}
