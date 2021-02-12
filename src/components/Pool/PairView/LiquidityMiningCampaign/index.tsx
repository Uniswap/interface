import React from 'react'
import { Box, Flex } from 'rebass'
import styled from 'styled-components'
import { DarkCard } from '../../../Card'
import { AutoRow } from '../../../Row'

const Divider = styled.div`
  height: 100%;
  width: 1px;
  background: ${props => props.theme.bg5};
`

interface LiquidityMiningCampaignProps {
  duration: number
}

export function LiquidityMiningCampaign({ duration }: LiquidityMiningCampaignProps) {
  return (
    <DarkCard>
      <AutoRow width="100%" justify="space-between">
        <Flex>
          <Box>{duration}</Box>
        </Flex>
        <Box mx="18px">
          <Divider />
        </Box>
        <Flex>
          <Box>{duration}</Box>
        </Flex>
      </AutoRow>
    </DarkCard>
  )
}
