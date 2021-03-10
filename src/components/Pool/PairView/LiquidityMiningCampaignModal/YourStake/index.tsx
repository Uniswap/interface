import { TokenAmount } from 'dxswap-sdk'
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
  stake?: TokenAmount
}

export default function LiquidityMiningYourStake({ stake }: LiquidityMiningYourStakeProps) {
  return (
    <AutoColumn gap="12px">
      <TYPE.body color="white" lineHeight="20px" fontWeight="600">
        Rewards program
      </TYPE.body>
      <Flex alignItems="center">
        <Box flex="1">
          <DataRow title="Stake size" value={stake ? stake.toSignificant(3) : '0'} />
        </Box>
        <Box mx="18px">
          <Divider />
        </Box>
        <Box flex="1">
          <DataRow title="Rewards" value={'TODO'} />
        </Box>
      </Flex>
    </AutoColumn>
  )
}
