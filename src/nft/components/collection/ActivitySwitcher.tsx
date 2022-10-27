import { ElementName, Event, EventName } from 'analytics/constants'
import { TraceEvent } from 'analytics/TraceEvent'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { useIsCollectionLoading } from 'nft/hooks'

import * as styles from './ActivitySwitcher.css'

export const ActivitySwitcher = ({
  showActivity,
  toggleActivity,
}: {
  showActivity: boolean
  toggleActivity: () => void
}) => {
  const isLoading = useIsCollectionLoading((state) => state.isCollectionStatsLoading)
  const loadingVals = new Array(2).fill(<div className={styles.styledLoading} />)

  return (
    <Row gap="24" marginBottom="28">
      {isLoading ? (
        loadingVals
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
            events={[Event.onClick]}
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
