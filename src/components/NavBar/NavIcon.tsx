import { Box } from 'nft/components/Box'
import { ReactNode } from 'react'

import * as styles from './NavIcon.css'

interface NavIconProps {
  children: ReactNode
  isActive?: boolean
  onClick: () => void
}

export const NavIcon = ({ children, isActive, onClick }: NavIconProps) => {
  return (
    <Box
      as="button"
      className={styles.navIcon}
      background={isActive ? 'accentActiveSoft' : 'none'}
      color={isActive ? 'textPrimary' : 'textSecondary'}
      onClick={onClick}
      height="40"
    >
      {children}
    </Box>
  )
}
