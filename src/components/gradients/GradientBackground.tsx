import React, { ComponentProps, PropsWithChildren } from 'react'
import { Box } from 'src/components/layout/Box'

type Props = ComponentProps<typeof Box>

// Fills up entire parent by default
export function GradientBackground({ children, ...rest }: PropsWithChildren<Props>) {
  return (
    <Box bottom={0} left={0} position="absolute" right={0} top={0} zIndex="background" {...rest}>
      {children}
    </Box>
  )
}
