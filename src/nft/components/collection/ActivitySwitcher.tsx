import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'

import * as styles from './ActivitySwitcher.css'

export const ActivitySwitcher = ({
  showActivity,
  toggleActivity,
}: {
  showActivity: boolean
  toggleActivity: () => void
}) => {
  return (
    <Row gap="24" marginBottom="28">
      <Box
        as="button"
        className={showActivity ? styles.activitySwitcherToggle : styles.selectedActivitySwitcherToggle}
        onClick={() => showActivity && toggleActivity()}
      >
        Items
      </Box>
      <Box
        as="button"
        className={!showActivity ? styles.activitySwitcherToggle : styles.selectedActivitySwitcherToggle}
        onClick={() => !showActivity && toggleActivity()}
      >
        Activity
      </Box>
    </Row>
  )
}
