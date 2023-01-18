import { BoxProps } from '@shopify/restyle'
import React from 'react'
import { ViewProps } from 'react-native'
import { Box } from 'src/components/layout'
import { Theme } from 'src/styles/theme'

export type BoxLoaderProps = { repeat?: number } & BoxProps<Theme, true> & ViewProps
export function BoxLoader({
  repeat = 1,
  backgroundColor = 'background3',
  borderRadius = 'md',
  width = '100%',
  height,
  ...props
}: BoxLoaderProps): JSX.Element {
  return (
    <Box>
      {new Array(repeat).fill(null).map((_, i) => (
        <React.Fragment key={i}>
          <Box
            backgroundColor={backgroundColor}
            borderRadius={borderRadius}
            height={height}
            width={width}
            {...props}
          />
        </React.Fragment>
      ))}
    </Box>
  )
}
