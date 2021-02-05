import React from 'react'
import styled from 'styled-components'
import { Card } from '../../styleds'
import { Box, Flex } from 'rebass'
import { Token } from 'dxswap-sdk'
import { TYPE } from '../../../../theme'
import BigNumber from 'bignumber.js'
import DoubleCurrencyLogo from '../../../DoubleLogo'

const SizedCard = styled(Card)`
  width: 155px;
  height: 147px;
`

interface AggregatedDistributionsProps {
  token0: Token
  token1: Token
  usdRewards: BigNumber
}

export default function Distribution({ token0, token1, usdRewards }: AggregatedDistributionsProps) {
  return (
    <SizedCard selectable>
      <Flex justifyContent="center" alignItems="center" flexDirection="column" width="100%">
        <Box mb="6px">
          <DoubleCurrencyLogo currency0={token0} currency1={token1} size={28} />
        </Box>
        <Box mb="8px">
          <TYPE.body color="white" lineHeight="19.5px" fontWeight="600" fontSize="16px">
            {token0.symbol}/{token1.symbol}
          </TYPE.body>
        </Box>
        <Box>
          <TYPE.subHeader fontSize="9px" color="text3" lineHeight="14px" letterSpacing="2%" fontWeight="600">
            ${usdRewards.decimalPlaces(2).toString()} REWARDS
          </TYPE.subHeader>
        </Box>
      </Flex>
    </SizedCard>
  )
}
