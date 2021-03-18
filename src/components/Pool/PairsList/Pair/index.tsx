import React from 'react'
import { Box, Flex } from 'rebass'
import { CurrencyAmount, Percent, Token } from 'dxswap-sdk'
import { TYPE } from '../../../../theme'
import DoubleCurrencyLogo from '../../../DoubleLogo'
import { DarkCard } from '../../../Card'
import styled from 'styled-components'
import ApyBadge from '../../ApyBadge'

const SizedCard = styled(DarkCard)`
  width: 208px;
  height: 155px;
  ::before {
    background: linear-gradient(153.77deg, rgba(55, 82, 233, 0.35) -144.38%, rgba(55, 82, 233, 0) 65.22%),
      linear-gradient(0deg, #171621, #171621);
  }
`

interface PairProps {
  token0?: Token
  token1?: Token
  usdRewards: CurrencyAmount
  apy: Percent
}

export default function Pair({ token0, token1, usdRewards, apy, ...rest }: PairProps) {
  return (
    <SizedCard selectable {...rest}>
      <Flex justifyContent="center" alignItems="center" flexDirection="column" width="100%" height="100%">
        <Box mb="6px">
          <DoubleCurrencyLogo currency0={token0} currency1={token1} size={28} />
        </Box>
        <Box>
          <TYPE.body color="white" lineHeight="19.5px" fontWeight="600" fontSize="16px">
            {token0?.symbol}/{token1?.symbol}
          </TYPE.body>
        </Box>
        {apy.greaterThan('0') && (
          <Box mt="8px">
            <ApyBadge apy={apy} />
          </Box>
        )}
        {usdRewards.greaterThan('0') && (
          <Box mt="4px">
            <TYPE.subHeader fontSize="9px" color="text3" lineHeight="14px" letterSpacing="2%" fontWeight="600">
              ${usdRewards.toFixed(2)} REWARDS
            </TYPE.subHeader>
          </Box>
        )}
      </Flex>
    </SizedCard>
  )
}
