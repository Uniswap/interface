import React from 'react'
import styled from 'styled-components'
import { Card } from '../../styleds'
import { Box, Flex } from 'rebass'
import CurrencyLogo from '../../../CurrencyLogo'
import { Token } from 'dxswap-sdk'
import { TYPE } from '../../../../theme'
import BigNumber from 'bignumber.js'

const SizedCard = styled(Card)`
  width: 155px;
  height: 147px;
`

interface AggregatedDistributionsProps {
  token: Token
  usdRewards: BigNumber
}

export default function AggregatedDistributions({ token, usdRewards }: AggregatedDistributionsProps) {
  return (
    <SizedCard m="8px" selectable>
      <Flex justifyContent="center" alignItems="center" flexDirection="column" width="100%">
        <Box mb="6px">
          <CurrencyLogo currency={token} size="28px" />
        </Box>
        <Box mb="8px">
          <TYPE.body color="white" lineHeight="19.5px" fontWeight="600" fontSize="16px">
            {token.symbol}
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
