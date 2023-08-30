import { BrowserEvent, InterfaceElementName, NFTEventName } from '@uniswap/analytics-events'
import { TraceEvent } from 'analytics'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { useIsCollectionLoading } from 'nft/hooks'
import styled from 'styled-components'

import * as styles from './ActivitySwitcher.css'

const BaseActivityContainer = styled(Row)`
  border-bottom: 1px solid;
  border-color: ${({ theme }) => theme.surface3};
  margin-right: 12px;
`

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
    <BaseActivityContainer gap="24" marginBottom="16">
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
            element={InterfaceElementName.NFT_ACTIVITY_TAB}
            name={NFTEventName.NFT_ACTIVITY_SELECTED}
          >
            <Box
              as="button"
              className={!showActivity ? styles.activitySwitcherToggle : styles.selectedActivitySwitcherToggle}
              onClick={() => !showActivity && toggleActivity()}
              data-testid="nft-activity"
            >
              Activity
            </Box>
          </TraceEvent>
        </>
      )}
    </BaseActivityContainer>
  )
}
