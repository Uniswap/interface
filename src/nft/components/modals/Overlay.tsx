import { Box } from '../Box'
import * as styles from './Overlay.css'

interface OverlayProps {
  onClick?: () => void
}

export const stopPropagation = (event: any) => {
  event.stopPropagation()
  event.nativeEvent.stopImmediatePropagation()
}

export const Overlay = ({ onClick = () => null }: OverlayProps) => {
  return <Box className={styles.overlay} onClick={onClick} />
}
