import React from 'react'
import styled from 'styled-components'
import { Box, Flex, Text } from 'rebass'

const EmptyListRoot = styled(Flex)`
  border: solid 1px ${props => props.theme.bg5};
  border-radius: 8px;
`

export default function Empty() {
  return (
    <EmptyListRoot flexDirection="column" justifyContent="center" alignItems="center" width="100%" height="195px">
      <Box>
        <Text fontSize="12px" fontWeight="700" lineHeight="15px" letterSpacing="0.08em">
          NO PAIRS YET
        </Text>
      </Box>
    </EmptyListRoot>
  )
}
