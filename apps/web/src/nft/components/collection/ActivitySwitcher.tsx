import { InterfaceElementName, NFTEventName } from '@uniswap/analytics-events'
import styled from 'lib/styled-components'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import * as styles from 'nft/components/collection/ActivitySwitcher.css'
import { useIsCollectionLoading } from 'nft/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'

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
          <Trace
            logPress
            element={InterfaceElementName.NFT_ACTIVITY_TAB}
            eventOnTrigger={NFTEventName.NFT_ACTIVITY_SELECTED}
          >
            <Box
              as="button"
              className={!showActivity ? styles.activitySwitcherToggle : styles.selectedActivitySwitcherToggle}
              onClick={() => !showActivity && toggleActivity()}
              data-testid="nft-activity"
            >
              Activity
            </Box>
          </Trace>
        </>
      )}
    </BaseActivityContainer>
  )
}
