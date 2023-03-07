import { ForwardedRef, forwardRef } from 'react'

import { Box, BoxProps } from './Box'

export const Row = forwardRef((props: BoxProps, ref: ForwardedRef<HTMLElement>) => {
  return <Box ref={ref} display="flex" flexDirection="row" alignItems="center" {...props} />
})

Row.displayName = 'Row'

export const Column = forwardRef((props: BoxProps, ref: ForwardedRef<HTMLElement>) => {
  return <Box ref={ref} display="flex" flexDirection="column" {...props} />
})

Column.displayName = 'Column'

export const Center = forwardRef((props: BoxProps, ref: ForwardedRef<HTMLElement>) => {
  return <Box ref={ref} display="flex" justifyContent="center" alignItems="center" {...props} />
})

Center.displayName = 'Center'
