import { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Box } from 'nft/components/Box'
import { ReactNode } from 'react'

import * as styles from './NavIcon.css'

interface NavIconProps {
  children: ReactNode
  isActive?: boolean
  label?: MessageDescriptor
  onClick: () => void
  activeBackground?: boolean
}

export const NavIcon = ({
  children,
  isActive,
  label = msg`Navigation button`,
  onClick,
  activeBackground,
}: NavIconProps) => {
  const { _ } = useLingui()

  return (
    <Box
      as="button"
      className={styles.navIcon}
      color={isActive ? 'neutral1' : 'neutral2'}
      onClick={onClick}
      height="40"
      width="40"
      aria-label={_(label)}
      backgroundColor={activeBackground ? 'accent2' : 'transparent'}
    >
      {children}
    </Box>
  )
}
