import React, { ReactNode } from 'react'
import { Box, BoxProps } from 'src/components/layout'

type Props = {
  icon: ReactNode
  overlay: ReactNode
} & Pick<BoxProps, 'top' | 'bottom' | 'left' | 'right'>

// For overlaying icons in JSX
export default function OverlayIcon({ icon, overlay, ...props }: Props): JSX.Element {
  return (
    <>
      {icon}
      <Box position="absolute" {...props}>
        {overlay}
      </Box>
    </>
  )
}
