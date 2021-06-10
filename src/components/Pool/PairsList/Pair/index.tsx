import React from 'react'
import { Box, Flex } from 'rebass'
import { CurrencyAmount, Percent, Token } from 'dxswap-sdk'
import { TYPE } from '../../../../theme'
import DoubleCurrencyLogo from '../../../DoubleLogo'
import { DarkCard } from '../../../Card'
import styled from 'styled-components'
import ApyBadge from '../../ApyBadge'
import { formatCurrencyAmount } from '../../../../utils'

const SizedCard = styled(DarkCard)`
  width: 210px;
  height: 108px;
  padding: 16px;
  ${props => props.theme.mediaWidth.upToMedium`
    width: 100%;
  `}
`

const PositiveBadgeRoot = styled.div`
  height: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(14, 159, 110, 0.1);
  border-radius: 4px;
  padding: 0 4px;
`

const BadgeText = styled.div`
  font-weight: 600;
  font-size: 9px;
  line-height: 11px;
  letter-spacing: 0.02em;
  color: ${props => props.theme.green2};
`

const EllipsizedText = styled(TYPE.body)`
  overflow: hidden;
  text-overflow: ellipsis;
`

interface PairProps {
  token0?: Token
  token1?: Token
  apy: Percent
  usdLiquidity: CurrencyAmount
  usdLiquidityText?: string
  staked?: boolean
}

export default function Pair({ token0, token1, usdLiquidity, apy, staked, usdLiquidityText, ...rest }: PairProps) {
  return (
    <SizedCard selectable {...rest}>
      <Flex flexDirection="column" justifyContent="space-between" height="100%">
        <Flex justifyContent="space-between" width="100%">
          <Box>
            <DoubleCurrencyLogo currency0={token0} currency1={token1} size={34} />
          </Box>
          <Flex flexDirection="column" alignItems="flex-end">
            {apy.greaterThan('0') && (
              <Box mb="8px">
                <ApyBadge apy={apy} />
              </Box>
            )}
            {staked && (
              <Box>
                <PositiveBadgeRoot>
                  <BadgeText>STAKING</BadgeText>
                </PositiveBadgeRoot>
              </Box>
            )}
          </Flex>
        </Flex>
        <Flex flexDirection="column">
          <Box>
            <TYPE.subHeader fontSize="9px" color="text4" lineHeight="14px" letterSpacing="2%" fontWeight="600">
              ${formatCurrencyAmount(usdLiquidity)} {usdLiquidityText?.toUpperCase() || 'LIQUIDITY'}
            </TYPE.subHeader>
          </Box>
          <Box>
            <EllipsizedText color="white" lineHeight="20px" fontWeight="700" fontSize="16px" maxWidth="100%">
              {token0?.symbol}/{token1?.symbol}
            </EllipsizedText>
          </Box>
        </Flex>
      </Flex>
    </SizedCard>
  )
}
