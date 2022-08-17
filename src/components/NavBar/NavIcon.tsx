import { Box } from 'nft/components/Box'
import { ReactNode } from 'react'

import * as styles from './NavIcon.css'

interface NavIconProps {
  children: ReactNode
  onClick: () => void
}

export const NavIcon = ({ children, onClick }: NavIconProps) => {
  return (
    <Box as="button" className={styles.navIcon} onClick={onClick}>
      {children}
    </Box>
  )
}
