import React from 'react'
import styled from 'styled-components'
import Skeleton from 'react-loading-skeleton'
import { DarkCard } from '../../../Card'
import { Box, Flex } from 'rebass'
import DoubleCurrencyLogo from '../../../DoubleLogo'

const SizedCard = styled(DarkCard)`
  width: 210px;
  height: 108px;
  padding: 12px 16px;
  ${props => props.theme.mediaWidth.upToMedium`
    width: 100%;
  `}
`

export default function LoadingCard() {
  return (
    <SizedCard width="100%" height="100%" padding="20px">
      <Flex width="100%" height="100%" justifyContent="space-between" flexDirection="column">
        <Flex justifyContent="space-between">
          <Box>
            <DoubleCurrencyLogo size={28} loading />
          </Box>
          <Box mt="5px">
            <Skeleton height="16px" width="36px" />
          </Box>
        </Flex>
        <Flex flexDirection="column">
          <Box>
            <Skeleton height="9px" width="40px" />
          </Box>
          <Box>
            <Skeleton height="20px" width="80px" />
          </Box>
        </Flex>
      </Flex>
    </SizedCard>
  )
}
