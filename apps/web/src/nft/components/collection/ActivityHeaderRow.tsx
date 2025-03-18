import { Box } from 'components/deprecated/Box'
import * as styles from 'nft/components/collection/Activity.css'

enum ColumnHeaders {
  Item = 'Item',
  Event = 'Event',
  Price = 'Price',
  By = 'By',
  To = 'To',
}

export const HeaderRow = () => {
  return (
    <Box className={styles.headerRow}>
      <Box>{ColumnHeaders.Item}</Box>
      <Box>{ColumnHeaders.Event}</Box>
      <Box display={{ sm: 'none', md: 'block' }}>{ColumnHeaders.Price}</Box>
      <Box display={{ sm: 'none', xl: 'block' }}>{ColumnHeaders.By}</Box>
      <Box display={{ sm: 'none', xxl: 'block' }}>{ColumnHeaders.To}</Box>
    </Box>
  )
}
