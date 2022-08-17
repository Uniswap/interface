import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import * as styles from 'nft/pages/collection/common.css'

interface ActivitySwitcherProps {
  showActivity: boolean
  toggleActivity: () => void
}

export const ActivitySwitcher = ({ showActivity, toggleActivity }: ActivitySwitcherProps) => {
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
