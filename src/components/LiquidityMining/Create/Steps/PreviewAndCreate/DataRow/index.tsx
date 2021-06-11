import React, { ReactNode } from 'react'
import { Box, Flex } from 'rebass'
import { TYPE } from '../../../../../../theme'

interface DataRowProps {
  name: string
  value: ReactNode
}

export default function DataRow({ name, value }: DataRowProps) {
  return (
    <Flex justifyContent="space-between" width="100%">
      <Box>
        <TYPE.small fontWeight="600" lineHeight="13px" color="text5">
          {name}
        </TYPE.small>
      </Box>
      <Box>
        <TYPE.small fontWeight="600" lineHeight="13px" color="text4">
          {value}
        </TYPE.small>
      </Box>
    </Flex>
  )
}
