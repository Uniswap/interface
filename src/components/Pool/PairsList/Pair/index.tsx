import React from 'react'
import { Box } from 'rebass'
import { CurrencyAmount, Percent, Token } from '@swapr/sdk'
import { TYPE } from '../../../../theme'
import DoubleCurrencyLogo from '../../../DoubleLogo'
import { DarkCard } from '../../../Card'
import styled from 'styled-components'
import ApyBadge from '../../ApyBadge'
import { formatCurrencyAmount } from '../../../../utils'
import { AutoColumn } from '../../../Column'
import { unwrappedToken } from '../../../../utils/wrappedCurrency'

const SizedCard = styled(DarkCard)`
  width: 210px;
  height: 120px;
  padding: 16px;
  ${props => props.theme.mediaWidth.upToMedium`
    width: 100%;
  `}
  ${props => props.theme.mediaWidth.upToExtraSmall`
    height: initial;
    padding: 22px 16px;
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

const TextWrapper = styled(Box)`
  order: 1;
  width: 100%;
  margin-top: 20px;
`

const BadgeWrapper = styled.div`
  align-self: flex-start;
  margin-left: auto;

  ${props => props.theme.mediaWidth.upToExtraSmall`
    align-self: center;
  `}
`

const RootFlex = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  ${props => props.theme.mediaWidth.upToExtraSmall`
    flex-direction: row-reverse;
    justify-content: auto;
  `}
`

const InnerUpperFlex = styled.div`
  height: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  ${props => props.theme.mediaWidth.upToExtraSmall`
    flex-direction: row-reverse;
    align-items: center;
  `}
`

const InnerLowerFlex = styled.div`
  display: flex;
  flex: 0;
  ${props => props.theme.mediaWidth.upToExtraSmall`
    flex: 1;
  `}
`

const MobileHidden = styled(Box)`
  display: block;
  ${props => props.theme.mediaWidth.upToExtraSmall`
    display: none;
  `}
`

const DesktopHidden = styled(Box)`
  display: none;
  ${props => props.theme.mediaWidth.upToExtraSmall`
    display: block;
  `}
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
      <RootFlex>
        <InnerUpperFlex>
          <MobileHidden>
            <DoubleCurrencyLogo currency0={token0} currency1={token1} size={34} />
          </MobileHidden>
          <Box>
            <AutoColumn gap="6px">
              {staked && (
                <PositiveBadgeRoot>
                  <BadgeText>STAKING</BadgeText>
                </PositiveBadgeRoot>
              )}
              {apy.greaterThan('0') && (
                <BadgeWrapper>
                  <ApyBadge apy={apy} />
                </BadgeWrapper>
              )}
            </AutoColumn>
          </Box>
        </InnerUpperFlex>
        <InnerLowerFlex>
          <DesktopHidden mr="8px" minWidth="auto">
            <DoubleCurrencyLogo currency0={token0} currency1={token1} size={34} />
          </DesktopHidden>
          <TextWrapper>
            <Box>
              <TYPE.subHeader fontSize="9px" color="text4" lineHeight="14px" letterSpacing="2%" fontWeight="600">
                ${formatCurrencyAmount(usdLiquidity)} {usdLiquidityText?.toUpperCase() || 'LIQUIDITY'}
              </TYPE.subHeader>
            </Box>
            <Box>
              <EllipsizedText color="white" lineHeight="20px" fontWeight="700" fontSize="16px" maxWidth="100%">
                {unwrappedToken(token0)?.symbol}/{unwrappedToken(token1)?.symbol}
              </EllipsizedText>
            </Box>
          </TextWrapper>
        </InnerLowerFlex>
      </RootFlex>
    </SizedCard>
  )
}
