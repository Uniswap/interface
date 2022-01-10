import React, { ComponentProps } from 'react'
import { Box, Flex as FlexBase, Inset } from 'src/components/layout'

export function FlexWithChildren(props: ComponentProps<typeof FlexBase>) {
  return (
    <FlexBase {...props}>
      <Box bg="primary1" borderRadius="sm">
        <Inset all="lg" />
      </Box>
      <Box bg="primary2" borderRadius="sm">
        <Inset all="lg" />
      </Box>
      <Box bg="primary3" borderRadius="sm">
        <Inset all="lg" />
      </Box>
      <Box bg="secondary1" borderRadius="sm">
        <Inset all="lg" />
      </Box>
    </FlexBase>
  )
}
