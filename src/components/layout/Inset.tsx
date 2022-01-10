import React, { PropsWithChildren } from 'react'
import { Box } from 'src/components/layout/Box'
import { Theme } from 'src/styles/theme'

interface InsetProps {
  /** applies consistent padding to each side */
  all?: keyof Theme['spacing']
}

/**
 * Spacing components that indents content on all four sides
 *
 * Inspired by https://medium.com/eightshapes-llc/space-in-design-systems-188bcbae0d62
 *
 * [internal]:
 *  API can be expanded to specific sides
 *  Debug options to color bg to debug spacing
 */
export function Inset({ all = 'md', children }: PropsWithChildren<InsetProps>) {
  return <Box p={all}>{children}</Box>
}
