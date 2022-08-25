import { Box } from 'nft/components/Box'
import { useIsMobile } from 'nft/hooks'
import { ReactNode } from 'react'

import * as styles from './NavDropdown.css'

interface NavDropdownProps {
  top: number
  right?: number
  leftAligned?: boolean
  horizontalPadding?: boolean
  centerHorizontally?: boolean
  paddingBottom?: number
  paddingTop?: number
  children: ReactNode
}

export const NavDropdown = ({
  top,
  centerHorizontally,
  leftAligned,
  horizontalPadding,
  paddingBottom,
  paddingTop,
  children,
}: NavDropdownProps) => {
  const isMobile = useIsMobile()
  return (
    <Box
      paddingX={horizontalPadding ? '16' : undefined}
      style={{
        top: isMobile ? 'unset' : `${top}px`,
        left: isMobile ? 0 : centerHorizontally ? '50%' : leftAligned ? '0px' : 'auto',
        right: isMobile ? 0 : centerHorizontally || leftAligned ? 'auto' : '0px',
        transform: centerHorizontally ? 'translateX(-50%)' : 'unset',
        paddingBottom: paddingBottom ?? '24px',
        paddingTop: paddingTop ?? '24px',
        zIndex: 3,
      }}
      className={styles.NavDropdown}
    >
      {children}
    </Box>
  )
}
