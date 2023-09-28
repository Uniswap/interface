import { createBox } from '@shopify/restyle'
import { ComponentProps } from 'react'
import { Theme } from 'ui/src/theme/restyle'

export type BoxProps = ComponentProps<typeof Box>
export const Box = createBox<Theme>()
