import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import * as styles from 'nft/pages/collection/index.css'

// import { CollectionNftsLoading } from './CollectionNfts'

export const CollectionPageLoading = () => {
  return (
    <Column width="full">
      <Box width="full" height="160">
        <Box width="full" height="160">
          <Box height="full" width="full" className={styles.loadingBanner} />
        </Box>
      </Box>
      <Column paddingX="32">
        {/* <CollectionStats stats={collectionStats || ({} as GenieCollection)} isMobile={isMobile} /> NEED Loading State */}

        {/* <ActivitySwitcher
          showActivity={isActivityToggled}
          toggleActivity={() => {
            isFiltersExpanded && setFiltersExpanded(false)
            toggleActivity()
          }}
        /> NEEd Loading vals */}
      </Column>
      <Row alignItems="flex-start" position="relative" paddingX="48">
        <Box position="sticky" top="72" width="0">
          {/* {isFiltersExpanded && <Filters traitsByGroup={collectionStats?.traits ?? {}} />} TODO add traits */}
        </Box>
        {/* <>{CollectionNftsLoading}</> */}
      </Row>
    </Column>
  )
}
