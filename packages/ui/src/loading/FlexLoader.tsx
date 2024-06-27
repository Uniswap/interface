import React from 'react'
import { ViewProps } from 'react-native'
import { Flex, FlexProps } from 'ui/src/components/layout'

export type FlexLoaderProps = { repeat?: number } & FlexProps & ViewProps

export function FlexLoader({
  repeat = 1,
  backgroundColor = '$neutral3',
  borderRadius = '$rounded12',
  width = '100%',
  height,
  ...props
}: FlexLoaderProps): JSX.Element {
  return (
    <Flex sentry-label="FlexLoader">
      {new Array(repeat).fill(null).map((_, i) => (
        <React.Fragment key={i}>
          <Flex
            backgroundColor={backgroundColor}
            borderRadius={borderRadius}
            height={height}
            width={width}
            {...props}
          />
        </React.Fragment>
      ))}
    </Flex>
  )
}
