import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import { Box, BoxProps } from 'src/components/layout/Box'
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
  const theme = useAppTheme()
  return (
    <Box
      flexGrow={0}
      flexShrink={0}
      height={y ? theme.spacing[y] : undefined}
      width={x ? theme.spacing[x] : undefined}
      {...rest}
    />
  )
}
