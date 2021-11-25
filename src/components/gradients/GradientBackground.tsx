import { PositionProps } from '@shopify/restyle'
import React, { PropsWithChildren } from 'react'
import { Box } from 'src/components/layout/Box'
import { Theme } from 'src/styles/theme'

type Props = PositionProps<Theme>

// Fills up entire parent by default
export function GradientBackground({ children, ...rest }: PropsWithChildren<Props>) {
  return (
    <Box position="absolute" top={0} left={0} bottom={0} right={0} zIndex="background" {...rest}>
      {children}
    </Box>
  )
}
