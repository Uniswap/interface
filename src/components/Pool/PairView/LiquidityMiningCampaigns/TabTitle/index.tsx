import { transparentize } from 'polished'
import React, { ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'
import { Box, Flex } from 'rebass'
import styled from 'styled-components'

const NumberBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 1px solid ${props => props.theme.bg3};
  border-radius: 50%;
  background-color: ${props => transparentize(0.3, props.theme.bg3)};
  font-weight: 500;
  font-size: 12px;
`

interface TabTitleProps {
  itemsAmount?: number
  loadingAmount: boolean
  children: ReactNode
}

export default function TabTitle({ itemsAmount, children, loadingAmount }: TabTitleProps) {
  return (
    <>
      <Flex alignItems="center">
        <Box>{children}</Box>
        <Box ml="8px">
          {loadingAmount ? <Skeleton circle width="16px" height="16px" /> : <NumberBadge>{itemsAmount}</NumberBadge>}
        </Box>
      </Flex>
    </>
  )
}
