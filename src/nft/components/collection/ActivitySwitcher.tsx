import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, ElementName, EventName } from '@uniswap/analytics-events'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { useIsCollectionLoading } from 'nft/hooks'

import * as styles from './ActivitySwitcher.css'

export const ActivitySwitcherLoading = new Array(2)
  .fill(null)
  .map((_, index) => <div className={styles.styledLoading} key={`ActivitySwitcherLoading-key-${index}`} />)

export const ActivitySwitcher = ({
  showActivity,
  toggleActivity,
}: {
  showActivity: boolean
  toggleActivity: () => void
}) => {
  const isLoading = useIsCollectionLoading((state) => state.isCollectionStatsLoading)

  return (
    <Row gap="24" marginBottom={{ sm: '16', md: '28' }}>
      {isLoading ? (
        ActivitySwitcherLoading
      ) : (
        <>
          <Box
            as="button"
            className={showActivity ? styles.activitySwitcherToggle : styles.selectedActivitySwitcherToggle}
            onClick={() => showActivity && toggleActivity()}
          >
            Items
          </Box>
          <TraceEvent
            events={[BrowserEvent.onClick]}
            element={ElementName.NFT_ACTIVITY_TAB}
            name={EventName.NFT_ACTIVITY_SELECTED}
          >
            <Box
              as="button"
              className={!showActivity ? styles.activitySwitcherToggle : styles.selectedActivitySwitcherToggle}
              onClick={() => !showActivity && toggleActivity()}
            >
              Activity
            </Box>
          </TraceEvent>
        </>
      )}
    </Row>
  )
}
