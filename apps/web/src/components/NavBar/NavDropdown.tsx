import { Box, BoxProps } from 'nft/components/Box'
import { useIsMobile } from 'nft/hooks'
import { ForwardedRef, forwardRef } from 'react'
import { Z_INDEX } from 'theme/zIndex'

import * as styles from './NavDropdown.css'

export const NavDropdown = forwardRef((props: BoxProps, ref: ForwardedRef<HTMLElement>) => {
  const isMobile = useIsMobile()
  return (
    <Box
      ref={ref}
      style={{ zIndex: Z_INDEX.modal }}
      className={isMobile ? styles.mobileNavDropdown : styles.NavDropdown}
      {...props}
    />
  )
})

NavDropdown.displayName = 'NavDropdown'
