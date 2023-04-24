import React from 'react'
import { ViewProps } from 'react-native'
import { Box, BoxProps } from 'src/components/layout/Box'

export const CenterBox = (props: BoxProps & ViewProps): JSX.Element => {
  return <Box alignItems="center" justifyContent="center" {...props} />
}
