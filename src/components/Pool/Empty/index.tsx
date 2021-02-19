import React, { ReactNode } from 'react'
import styled from 'styled-components'
import { Box, Flex } from 'rebass'

const EmptyListRoot = styled(Flex)`
  border: solid 1px ${props => props.theme.bg5};
  border-radius: 8px;
`

interface EmptyProps {
  children: ReactNode
}

export default function Empty({ children }: EmptyProps) {
  return (
    <EmptyListRoot flexDirection="column" justifyContent="center" alignItems="center" width="100%" height="195px">
      <Box>{children}</Box>
    </EmptyListRoot>
  )
}
