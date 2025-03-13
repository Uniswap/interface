import { InterfaceElementName, NFTEventName } from '@uniswap/analytics-events'
import * as styles from 'nft/components/collection/ActivitySwitcher.css'
import { useIsCollectionLoading } from 'nft/hooks'
import { Flex, Text } from 'ui/src'
import Trace from 'uniswap/src/features/telemetry/Trace'

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
    <Flex row gap="$gap24" pb="$spacing8" borderBottomWidth={1} borderColor="$surface3" mr="$spacing12">
      {isLoading ? (
        ActivitySwitcherLoading
      ) : (
        <>
          <Text
            variant="buttonLabel1"
            className={showActivity ? styles.activitySwitcherToggle : styles.selectedActivitySwitcherToggle}
            onPress={() => showActivity && toggleActivity()}
          >
            Items
          </Text>
          <Trace
            logPress
            element={InterfaceElementName.NFT_ACTIVITY_TAB}
            eventOnTrigger={NFTEventName.NFT_ACTIVITY_SELECTED}
          >
            <Text
              variant="buttonLabel1"
              className={!showActivity ? styles.activitySwitcherToggle : styles.selectedActivitySwitcherToggle}
              onPress={() => !showActivity && toggleActivity()}
              data-testid="nft-activity"
            >
              Activity
            </Text>
          </Trace>
        </>
      )}
    </Flex>
  )
}
