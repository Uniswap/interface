import { PricedTokenAmount } from 'dxswap-sdk'
import React from 'react'
import { Box, Flex } from 'rebass'
import styled from 'styled-components'
import { TYPE } from '../../../../../theme'
import { AutoColumn } from '../../../../Column'
import DataRow from '../DataRow'

const Divider = styled.div`
  height: 100%;
  width: 1px;
  margin: 24px;
  background: ${props => props.theme.bg5};
`

interface LiquidityMiningYourStakeProps {
  stake?: PricedTokenAmount
  claimables?: PricedTokenAmount[]
}

export default function LiquidityMiningYourStake({ stake, claimables }: LiquidityMiningYourStakeProps) {
  return (
    <AutoColumn gap="12px">
      <TYPE.body color="white" lineHeight="20px" fontWeight="600">
        Your position
      </TYPE.body>
      <Flex alignItems="center">
        <Box flex="1">
          <DataRow title="Stake size" value={stake ? stake.toSignificant(3) : '0'} />
        </Box>
        <Box mx="18px">
          <Divider />
        </Box>
        <Box flex="1">
          <DataRow title="Rewards" value={claimables && claimables.length > 0 ? claimables[0].toSignificant(3) : '0'} />
        </Box>
      </Flex>
    </AutoColumn>
  )
}
