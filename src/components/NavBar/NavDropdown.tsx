import { Box } from 'nft/components/Box'
import { ReactNode } from 'react'

import * as styles from './NavDropdown.css'

interface NavDropdownProps {
  top: number
  right?: number
  leftAligned?: boolean
  horizontalPadding?: boolean
  centerHorizontally?: boolean
  children: ReactNode
}

export const NavDropdown = ({
  top,
  centerHorizontally,
  leftAligned,
  horizontalPadding,
  children,
}: NavDropdownProps) => {
  return (
    <Box
      paddingX={horizontalPadding ? '16' : undefined}
      style={{
        top: `${top}px`,
        left: centerHorizontally ? '50%' : leftAligned ? '0px' : 'auto',
        right: centerHorizontally || leftAligned ? 'auto' : '10px',
        transform: centerHorizontally ? 'translateX(-50%)' : 'unset',
        zIndex: 3,
      }}
      className={styles.NavDropdown}
    >
      {children}
    </Box>
  )
}
