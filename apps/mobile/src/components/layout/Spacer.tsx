import React from 'react'
import { Box, BoxProps } from 'src/components/layout/Box'
import { spacing } from 'ui/src/theme'
import { Theme } from 'ui/src/theme/restyle'

export type SpacerProps = BoxProps & {
  x?: keyof Theme['spacing']
  y?: keyof Theme['spacing']
}

/**
 * Layout component to render physical spacing.
 * Useful to avoid using margin props which break component isolation
 */
export function Spacer({ x, y, ...rest }: SpacerProps): JSX.Element {
  return (
    <Box
      flexGrow={0}
      flexShrink={0}
      height={y ? spacing[y] : undefined}
      width={x ? spacing[x] : undefined}
      {...rest}
    />
  )
}
