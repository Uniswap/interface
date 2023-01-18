import React from 'react'
import { ViewProps } from 'react-native'
import { Box, BoxProps } from 'src/components/layout'

export type BoxLoaderProps = { repeat?: number } & BoxProps & ViewProps
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
