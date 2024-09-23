import { Box } from 'nft/components/Box'
import * as styles from 'nft/components/modals/Overlay.css'
import noop from 'utilities/src/react/noop'

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
