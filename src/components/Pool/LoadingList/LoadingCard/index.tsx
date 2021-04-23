import React from 'react'
import styled from 'styled-components'
import Skeleton from 'react-loading-skeleton'
import { DarkCard } from '../../../Card'
import { Box, Flex } from 'rebass'
import DoubleCurrencyLogo from '../../../DoubleLogo'

const SizedCard = styled(DarkCard)`
  width: 210px;
  height: 108px;
  padding: 16px;
  ${props => props.theme.mediaWidth.upToMedium`
    width: 100%;
  `}
`

export default function LoadingCard() {
  return (
    <SizedCard selectable>
      <Flex flexDirection="column" justifyContent="space-between" height="100%">
        <Flex justifyContent="space-between" width="100%">
          <Box>
            <DoubleCurrencyLogo loading size={34} />
          </Box>
          <Flex flexDirection="column">
            <Box mb="8px">
              <Skeleton height="16px" width="36px" />
            </Box>
          </Flex>
        </Flex>
        <Flex flexDirection="column" justifyContent="flex-end">
          <Box mb="2px">
            <Skeleton height="9px" width="40px" style={{ display: 'flex' }} />
          </Box>
          <Box>
            <Skeleton height="20px" width="80px" />
          </Box>
        </Flex>
      </Flex>
    </SizedCard>
  )
}
