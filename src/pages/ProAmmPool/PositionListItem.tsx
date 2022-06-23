import React, { useState } from 'react'
import { Position } from '@kyberswap/ks-sdk-elastic'
import { useToken } from 'hooks/Tokens'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import { usePool } from 'hooks/usePools'
import { useMemo } from 'react'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { PositionDetails } from 'types/position'
import { CurrencyAmount, Price, Token, ChainId } from '@kyberswap/ks-sdk-core'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { ExternalLink, StyledInternalLink } from 'theme'
import { Trans, t } from '@lingui/macro'
import { currencyId } from 'utils/currencyId'
import { LightCard } from 'components/Card'
import ProAmmPoolInfo from 'components/ProAmm/ProAmmPoolInfo'
import { ButtonEmpty, ButtonOutlined, ButtonPrimary } from 'components/Button'
import ProAmmPooledTokens from 'components/ProAmm/ProAmmPooledTokens'
import ProAmmFee from 'components/ProAmm/ProAmmFee'
import ProAmmPriceRange from 'components/ProAmm/ProAmmPriceRange'
import { Flex, Text } from 'rebass'
import { useWeb3React } from '@web3-react/core'
import Divider from 'components/Divider'
import ContentLoader from './ContentLoader'
import { PROMM_ANALYTICS_URL } from 'constants/index'
import { useTokensPrice } from 'state/application/hooks'
import DropIcon from 'components/Icons/DropIcon'
import { MouseoverTooltip } from 'components/Tooltip'
import { UserPositionFarm } from 'state/farms/promm/types'
import useTheme from 'hooks/useTheme'
import { RowBetween } from 'components/Row'
import { formatDollarAmount } from 'utils/numbers'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { VERSION } from 'constants/v2'

const StyledPositionCard = styled(LightCard)`
  border: none;
  background: ${({ theme }) => theme.background};
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  padding: 28px 20px 16px;
  display: flex;
  flex-direction: column;
`

const TabContainer = styled.div`
  display: flex;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.buttonBlack};
`

const Tab = styled(ButtonEmpty)<{ isActive?: boolean; isLeft?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  background-color: ${({ theme, isActive }) => (isActive ? theme.primary : theme.buttonBlack)};
  padding: 6px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 20px;

  &:hover {
    text-decoration: none;
  }
`

const TabText = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 2px;
  color: ${({ theme, isActive }) => (isActive ? theme.textReverse : theme.subText)};
`

const StakedInfo = styled.div`
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.border};
  padding: 12px;
  margin-top: 16px;
`

const StakedRow = styled.div`
  line-height: 24px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
`

interface PositionListItemProps {
  positionDetails: PositionDetails | UserPositionFarm
  farmAvailable?: boolean
  stakedLayout?: boolean
  refe?: React.MutableRefObject<any>
}

export function getPriceOrderingFromPositionForUI(
  position?: Position,
): {
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  quote?: Token
  base?: Token
} {
  if (!position) {
    return {}
  }
  const token0 = position.amount0.currency
  const token1 = position.amount1.currency
  // otherwise, just return the default
  return {
    priceLower: position.token0PriceLower,
    priceUpper: position.token0PriceUpper,
    quote: token1,
    base: token0,
  }
}
export default function PositionListItem({
  stakedLayout,
  farmAvailable,
  positionDetails,
  refe,
}: PositionListItemProps) {
  const { chainId } = useWeb3React()
  const {
    token0: token0Address,
    token1: token1Address,
    fee: feeAmount,
    liquidity,
    tickLower,
    tickUpper,
  } = positionDetails

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)
  if (refe && token0 && !refe.current[token0Address.toLocaleLowerCase()] && token0.symbol) {
    refe.current[token0Address.toLocaleLowerCase()] = token0.symbol.toLowerCase()
  }
  if (refe && token1 && !refe.current[token1Address.toLocaleLowerCase()] && token1.symbol) {
    refe.current[token1Address.toLocaleLowerCase()] = token1.symbol.toLowerCase()
  }
  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  const prices = useTokensPrice([token0, token1], VERSION.ELASTIC)

  // construct Position from details returned
  const [, pool] = usePool(currency0 ?? undefined, currency1 ?? undefined, feeAmount)

  const position = useMemo(() => {
    if (pool) {
      return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper])

  const stakedPosition =
    pool && farmAvailable
      ? new Position({
          pool,
          liquidity: (positionDetails as UserPositionFarm).stakedLiquidity.toString(),
          tickLower,
          tickUpper,
        })
      : undefined

  const usd =
    parseFloat(position?.amount0.toExact() || '0') * prices[0] +
    parseFloat(position?.amount1.toExact() || '0') * prices[1]

  const stakedUsd =
    parseFloat(stakedPosition?.amount0.toExact() || '0') * prices[0] +
    parseFloat(stakedPosition?.amount1.toExact() || '0') * prices[1]

  const tickAtLimit = useIsTickAtLimit(feeAmount, tickLower, tickUpper)

  // prices
  const { priceLower, priceUpper } = getPriceOrderingFromPositionForUI(position)

  const removed = liquidity?.eq(0)
  const theme = useTheme()

  const { mixpanelHandler } = useMixpanel()

  const [activeTab, setActiveTab] = useState(0)
  return position && priceLower && priceUpper ? (
    <StyledPositionCard>
      {farmAvailable && (
        <div
          style={{
            overflow: 'hidden',
            borderTopLeftRadius: '8px',
            position: 'absolute',
            top: 0,
            left: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <MouseoverTooltip text={t`Available for yield farming`}>
            <DropIcon />
          </MouseoverTooltip>
        </div>
      )}
      <>
        <ProAmmPoolInfo position={position} tokenId={positionDetails.tokenId.toString()} />
        <TabContainer style={{ marginTop: '1rem' }}>
          <Tab isActive={activeTab === 0} padding="0" onClick={() => setActiveTab(0)}>
            <TabText isActive={activeTab === 0} style={{ fontSize: '12px' }}>
              <Trans>Your Liquidity</Trans>
            </TabText>
          </Tab>
          <Tab isActive={activeTab === 1} padding="0" onClick={() => setActiveTab(1)}>
            <TabText isActive={activeTab === 1} style={{ fontSize: '12px' }}>
              <Trans>Price Range</Trans>
            </TabText>
          </Tab>
        </TabContainer>
        {activeTab === 0 && (
          <>
            {!stakedLayout ? (
              <ProAmmPooledTokens
                valueUSD={usd}
                stakedUsd={stakedUsd}
                liquidityValue0={CurrencyAmount.fromRawAmount(
                  unwrappedToken(position.pool.token0),
                  position.amount0.quotient,
                )}
                liquidityValue1={CurrencyAmount.fromRawAmount(
                  unwrappedToken(position.pool.token1),
                  position.amount1.quotient,
                )}
                layout={1}
              />
            ) : (
              <StakedInfo>
                <StakedRow>
                  <Text color={theme.subText}>
                    <Trans>Your Staked Balance</Trans>
                  </Text>
                  <Text>{formatDollarAmount(stakedUsd)}</Text>
                </StakedRow>

                <StakedRow>
                  <Text color={theme.subText}>
                    <Trans>Your Staked {position.amount0.currency.symbol}</Trans>
                  </Text>
                  <Text>{stakedPosition?.amount0.toSignificant(6)}</Text>
                </StakedRow>

                <StakedRow>
                  <Text color={theme.subText}>
                    <Trans>Your Staked {position.amount1.currency.symbol}</Trans>
                  </Text>
                  <Text>{stakedPosition?.amount1.toSignificant(6)}</Text>
                </StakedRow>

                <StakedRow>
                  <Text color={theme.subText}>
                    <Trans>Farm APY</Trans>
                  </Text>
                  <Text color={theme.apr}>--</Text>
                </StakedRow>
              </StakedInfo>
            )}
            {!stakedLayout && (
              <ProAmmFee
                position={position}
                tokenId={positionDetails.tokenId}
                layout={1}
                farmAvailable={farmAvailable}
              />
            )}
          </>
        )}
        {activeTab === 1 && <ProAmmPriceRange position={position} ticksAtLimit={tickAtLimit} layout={1} />}
        <div style={{ marginTop: '20px' }} />
        <Flex flexDirection={'column'} marginTop="auto">
          {stakedLayout ? (
            <ButtonPrimary
              style={{ marginBottom: '20px', textDecoration: 'none', color: theme.textReverse, fontSize: '14px' }}
              padding="8px"
              as={StyledInternalLink}
              to="/farms"
            >
              <Trans>Go to Farm</Trans>
            </ButtonPrimary>
          ) : (
            <Flex marginBottom="20px" sx={{ gap: '1rem' }}>
              {removed ? (
                <ButtonPrimary disabled padding="8px" style={{ flex: 1 }}>
                  <Text width="max-content" fontSize="14px">
                    <Trans>Increase Liquidity</Trans>
                  </Text>
                </ButtonPrimary>
              ) : (
                <ButtonPrimary
                  padding="8px"
                  style={{
                    borderRadius: '18px',
                    fontSize: '14px',
                    flex: 1,
                  }}
                  as={Link}
                  to={`/elastic/increase/${currencyId(currency0, chainId)}/${currencyId(
                    currency1,
                    chainId,
                  )}/${feeAmount}/${positionDetails.tokenId}`}
                  onClick={() => {
                    mixpanelHandler(MIXPANEL_TYPE.ELASTIC_INCREASE_LIQUIDITY_INITIATED, {
                      token_1: token0?.symbol || '',
                      token_2: token1?.symbol || '',
                      fee_tier: (pool?.fee as number) / 10000,
                    })
                  }}
                >
                  <Text width="max-content" fontSize="14px">
                    <Trans>Increase Liquidity</Trans>
                  </Text>
                </ButtonPrimary>
              )}
              {removed ? (
                <ButtonOutlined disabled padding="8px" style={{ flex: 1 }}>
                  <Text width="max-content" fontSize="14px">
                    <Trans>Remove Liquidity</Trans>
                  </Text>
                </ButtonOutlined>
              ) : farmAvailable ? (
                <ButtonOutlined
                  padding="0"
                  style={{
                    flex: 1,
                    color: theme.disableText,
                    border: `1px solid ${theme.disableText}`,
                    cursor: 'not-allowed',
                  }}
                >
                  <MouseoverTooltip text={farmAvailable ? t`You need to withdraw your liquidity first` : ''}>
                    <Text width="max-content" fontSize="14px" padding="8px">
                      <Trans>Remove Liquidity</Trans>
                    </Text>
                  </MouseoverTooltip>
                </ButtonOutlined>
              ) : (
                <ButtonOutlined
                  padding="8px"
                  as={Link}
                  to={`/elastic/remove/${positionDetails.tokenId}`}
                  style={{ flex: 1 }}
                  onClick={() => {
                    mixpanelHandler(MIXPANEL_TYPE.ELASTIC_REMOVE_LIQUIDITY_INITIATED, {
                      token_1: token0?.symbol || '',
                      token_2: token1?.symbol || '',
                      fee_tier: (pool?.fee as number) / 10000,
                    })
                  }}
                >
                  <Text width="max-content" fontSize="14px">
                    <Trans>Remove Liquidity</Trans>
                  </Text>
                </ButtonOutlined>
              )}
            </Flex>
          )}
          <Divider sx={{ marginBottom: '20px' }} />
          <RowBetween>
            <ButtonEmpty width="max-content" style={{ fontSize: '14px' }} padding="0">
              <ExternalLink
                style={{ width: '100%', textAlign: 'center' }}
                href={`${PROMM_ANALYTICS_URL[chainId as ChainId]}/pool/${positionDetails.poolId.toLowerCase()}`}
              >
                <Trans>Pool Analytics ↗</Trans>
              </ExternalLink>
            </ButtonEmpty>

            {farmAvailable && (
              <ButtonEmpty width="max-content" style={{ fontSize: '14px' }} padding="0">
                <StyledInternalLink style={{ width: '100%', textAlign: 'center' }} to="/farms">
                  <Trans>Go to Farms ↗</Trans>
                </StyledInternalLink>
              </ButtonEmpty>
            )}
          </RowBetween>
        </Flex>
      </>
    </StyledPositionCard>
  ) : (
    <ContentLoader />
  )
}
