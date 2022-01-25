import React from 'react'

import { CurrencyAmount, Percent, Token } from '@swapr/sdk'
import { MEDIA_WIDTHS, TYPE } from '../../../../theme'
import DoubleCurrencyLogo from '../../../DoubleLogo'
import { DarkCard } from '../../../Card'
import styled from 'styled-components'
import { usePair24hVolumeUSD } from '../../../../hooks/usePairVolume24hUSD'
import { formatCurrencyAmount } from '../../../../utils'

import { unwrappedToken } from '../../../../utils/wrappedCurrency'

import { useWindowSize } from '../../../../hooks/useWindowSize'
import { Flex, Text } from 'rebass'
import { ReactComponent as FarmingLogo } from '../../../../assets/svg/farming.svg'
import ApyBadge from '../../ApyBadge'
import CurrencyLogo from '../../../CurrencyLogo'
import CarrotBadge from '../../../Badge/Carrot'

const SizedCard = styled(DarkCard)`
  //THIS SHOULD BE TOOGLEABLE 210PX OR 100% DEPENDING ON LAYOUT CHOSEN
  width: 100%;
  /* height: 120px; */
  padding: 17.5px 20px;
  overflow: hidden;
  ${props => props.theme.mediaWidth.upToMedium`
    width: 100%;
  `}
  ${props => props.theme.mediaWidth.upToExtraSmall`
    height: initial;
    padding: 22px 16px;
  `}
`

const FarmingBadge = styled.div<{ isGreyed?: boolean }>`
  height: 16px;
  border: ${props => !props.isGreyed && `solid 1.5px ${props.theme.green2}`};
  color: ${props => (props.isGreyed ? props.theme.purple2 : props.theme.green2)};
  border-radius: 6px;
  width: fit-content;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  padding: 0 4px;
  background-color: ${props => props.isGreyed && props.theme.bg3};
  opacity: ${props => props.isGreyed && '0.5'};
  svg {
    > path {
      fill: ${props => (props.isGreyed ? props.theme.purple2 : props.theme.green2)};
    }
  }
  font-weight: 700;
  margin-left: 3px;
  font-size: 9px;
  line-height: 9px;
  letter-spacing: 0.02em;
`

const BadgeText = styled.div`
  font-weight: 700;
  margin-left: 3px;
  font-size: 9px;
  line-height: 9px;
  letter-spacing: 0.02em;
`

const EllipsizedText = styled(TYPE.body)`
  overflow: hidden;
  text-overflow: ellipsis;
`

const TitleText = styled(Text)`
  color: ${props => props.theme.purple2};
  font-size: 10px;
  font-weight: 600;
  line-height: 12px;
  opacity: 0.5;
`
const ValueText = styled.div`
  color: ${props => props.theme.purple2};
  font-size: 14px;
  font-weight: 500;
  line-height: 16.8px;
  font-family: 'Fira Code';
`
const ItemsWrapper = styled(Flex)`
  justify-content: space-evenly;
  flex-direction: column;
`

interface PairProps {
  token0?: Token
  token1?: Token
  apy: Percent
  usdLiquidity: CurrencyAmount
  usdLiquidityText?: string
  pairOrStakeAddress?: string
  containsKpiToken?: boolean
  hasFarming?: boolean
  isSingleSidedStakingCampaign?: boolean
  dayLiquidity?: string
}

export default function Pair({
  token0,
  token1,
  usdLiquidity,
  apy,
  containsKpiToken,
  usdLiquidityText,
  pairOrStakeAddress,
  hasFarming,
  dayLiquidity,
  isSingleSidedStakingCampaign,
  ...rest
}: PairProps) {
  const { width } = useWindowSize()
  const { volume24hUSD, loading } = usePair24hVolumeUSD(pairOrStakeAddress, isSingleSidedStakingCampaign)

  const isMobile = width ? width < MEDIA_WIDTHS.upToExtraSmall : false

  return (
    <SizedCard selectable {...rest}>
      <Flex height="100%" justifyContent="space-between">
        <Flex flexDirection={isMobile ? 'column' : 'row'} alignItems={!isMobile ? 'center' : ''}>
          {isSingleSidedStakingCampaign ? (
            <CurrencyLogo size={isMobile ? '64px' : '45px'} marginRight={14} currency={token0} />
          ) : (
            <DoubleCurrencyLogo
              spaceBetween={isMobile ? -12 : 0}
              marginLeft={isMobile ? -23 : 0}
              marginRight={isMobile ? 0 : 14}
              top={isMobile ? -25 : 0}
              currency0={token0}
              currency1={token1}
              size={isMobile ? 64 : 45}
            />
          )}
          <EllipsizedText
            color="white"
            lineHeight="20px"
            fontWeight="700"
            fontSize="16px"
            maxWidth={isMobile ? '100%' : '145px'}
          >
            {unwrappedToken(token0)?.symbol}

            {!isSingleSidedStakingCampaign && (isMobile ? '/' : <br></br>)}

            {!isSingleSidedStakingCampaign && unwrappedToken(token1)?.symbol}
          </EllipsizedText>

          {isMobile && (
            <TYPE.subHeader fontSize="9px" color="text4" lineHeight="14px" letterSpacing="2%" fontWeight="600">
              ${formatCurrencyAmount(usdLiquidity)} {usdLiquidityText?.toUpperCase() || 'LIQUIDITY'}
            </TYPE.subHeader>
          )}
        </Flex>
        <Flex width={isMobile ? 'auto' : '70%'} justifyContent="space-between">
          <Flex
            width={isMobile ? 'auto' : '35%'}
            flexDirection="column"
            alignItems="flex-start"
            justifyContent={isMobile ? '' : 'space-evenly'}
          >
            {!isMobile && <TitleText marginBottom={'6px'}>CAMPAIGNS</TitleText>}

            <Flex
              style={{ gap: '6px' }}
              flexDirection={isMobile ? 'column' : 'row'}
              alignItems={isMobile ? 'flex-end' : 'flex-start'}
              flexWrap="wrap"
            >
              {apy.greaterThan('0') && isMobile && (
                <Flex alignSelf={isMobile ? 'center' : 'flex-start'} marginLeft="auto">
                  <ApyBadge upTo={containsKpiToken} apy={apy} />
                </Flex>
              )}
              <FarmingBadge isGreyed={!hasFarming}>
                <FarmingLogo />
                <BadgeText>FARMING</BadgeText>
              </FarmingBadge>
              <CarrotBadge isGreyed={!containsKpiToken} />
            </Flex>
          </Flex>
          {!isMobile && (
            <>
              <ItemsWrapper>
                <TitleText>TVL</TitleText>
                <ValueText> ${formatCurrencyAmount(usdLiquidity).split('.')[0]}</ValueText>
              </ItemsWrapper>
              <ItemsWrapper>
                <TitleText>24h VOLUME</TitleText>
                <ValueText>
                  ${!loading && volume24hUSD ? formatCurrencyAmount(volume24hUSD).split('.')[0] : dayLiquidity}
                  {dayLiquidity && dayLiquidity}
                </ValueText>
              </ItemsWrapper>
              <ItemsWrapper width={'60px'}>
                <TitleText>APY</TitleText>

                <Text fontWeight="700" fontSize="18px" fontFamily="Fira Code">
                  {apy.toFixed(0)}%
                </Text>
              </ItemsWrapper>
            </>
          )}
        </Flex>
      </Flex>
    </SizedCard>
  )
}
