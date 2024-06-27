import noop from 'utilities/src/react/noop'

import { Box } from '../Box'
import * as styles from './Overlay.css'

interface OverlayProps {
  onClick?: () => void
}

export const stopPropagation = (event: React.SyntheticEvent<HTMLElement>) => {
  event.stopPropagation()
  event.nativeEvent.stopImmediatePropagation()
}

export const Overlay = ({ onClick = noop }: OverlayProps) => {
  return <Box className={styles.overlay} onClick={onClick} />
}
