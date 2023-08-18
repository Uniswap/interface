import React from 'react'
import { ViewProps } from 'react-native'
import { Box, BoxProps } from 'ui/src/components/layout'

export type BoxLoaderProps = { repeat?: number } & BoxProps & ViewProps
export function BoxLoader({
  repeat = 1,
  backgroundColor = '$surface3',
  borderRadius = '$rounded12',
  width = '100%',
  height,
  ...props
}: BoxLoaderProps): JSX.Element {
  return (
    <Box sentry-label="BoxLoader">
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
