import React, { ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'
import { Box, Flex } from 'rebass'
import { NumberBadge, NumberBadgeProps } from '../../../../NumberBadge'

interface TabTitleProps extends NumberBadgeProps {
  itemsAmount?: number
  loadingAmount: boolean
  children: ReactNode
}

export default function TabTitle({ itemsAmount, children, loadingAmount, badgeTheme }: TabTitleProps) {
  return (
    <>
      <Flex alignItems="center">
        <Box>{children}</Box>
        <Box ml="8px">
          {loadingAmount ? (
            <Skeleton circle width="16px" height="16px" />
          ) : (
            <NumberBadge style={itemsAmount === 0 ? { opacity: 0.5 } : {}} badgeTheme={badgeTheme}>
              <span>{itemsAmount}</span>
            </NumberBadge>
          )}
        </Box>
      </Flex>
    </>
  )
}
