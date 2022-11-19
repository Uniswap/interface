import { Box } from 'nft/components/Box'
import { ReactNode } from 'react'

import * as styles from './NavIcon.css'

interface NavIconProps {
  children: ReactNode
  isActive?: boolean
  isMobile?: boolean
  onClick: () => void
}

export const NavIcon = ({ children, isActive, onClick, isMobile }: NavIconProps) => {
  return (
    <Box
      as="button"
      className={isMobile ? styles.navIcon : styles.navIconHidden}
      color={isActive ? 'textPrimary' : 'textSecondary'}
      onClick={onClick}
      height="40"
      width="40"
    >
      {children}
    </Box>
  )
}
