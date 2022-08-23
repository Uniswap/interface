import { Box } from 'nft/components/Box'

import * as styles from './CarouselIndicator.css'

const CarouselIndicator = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
  <Box
    cursor="pointer"
    paddingTop="16"
    paddingBottom="16"
    onClick={(e) => {
      e.preventDefault()
      e.stopPropagation()
      onClick()
    }}
  >
    <Box
      as="span"
      className={styles.carouselIndicator}
      backgroundColor={active ? 'explicitWhite' : 'accentTextLightTertiary'}
    />
  </Box>
)

export default CarouselIndicator
