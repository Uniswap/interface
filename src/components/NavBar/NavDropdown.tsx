import { Box, BoxProps } from 'nft/components/Box'
import { useIsMobile } from 'nft/hooks'
// import { ReactNode } from 'react'
import { ForwardedRef, forwardRef } from 'react'

import * as styles from './NavDropdown.css'

// interface NavDropdownProps {
//   top?: number
//   right?: number
//   leftAligned?: boolean
//   paddingBottom?: number
//   paddingTop?: number
//   children: ReactNode
// }

// export const NavDropdown = ({ top, leftAligned, paddingBottom, paddingTop, children }: NavDropdownProps) => {
//   const isMobile = useIsMobile()
//   return (
//     <Box
//       style={{
//         top: isMobile ? 'unset' : `${top}px`,
//         left: isMobile ? 0 : leftAligned ? '0px' : 'auto',
//         right: isMobile ? 0 : leftAligned ? 'auto' : '0px',
//         paddingBottom: paddingBottom ?? '24px',
//         paddingTop: paddingTop ?? '24px',

//       }}
//       className={styles.NavDropdown}
//     >
//       {children}
//     </Box>
//   )
// }

export const NavDropdown = forwardRef((props: BoxProps, ref: ForwardedRef<HTMLElement>) => {
  const isMobile = useIsMobile()
  return <Box ref={ref} className={isMobile ? styles.mobileNavDropdown : styles.NavDropdown} {...props} />
})

NavDropdown.displayName = 'NavDropdown'
