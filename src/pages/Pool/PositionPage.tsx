import React, { useMemo } from 'react'
import { Position } from '@uniswap/v3-sdk'
import { PoolState, usePool } from 'data/Pools'
import { useActiveWeb3React } from 'hooks'
import { useToken } from 'hooks/Tokens'
import { useV3Positions } from 'hooks/useV3Positions'
import { RouteComponentProps, Link } from 'react-router-dom'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { LoadingRows } from './styleds'
import styled from 'styled-components'
import { AutoColumn } from 'components/Column'
import { RowBetween, RowFixed } from 'components/Row'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { TYPE } from 'theme'
import Badge, { BadgeVariant } from 'components/Badge'
import { basisPointsToPercent } from 'utils'
import { ButtonPrimary } from 'components/Button'
import { DarkCard, DarkGreyCard } from 'components/Card'
import CurrencyLogo from 'components/CurrencyLogo'
import { AlertTriangle } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { useV3PositionFees } from 'hooks/useV3PositionFees'
import { formatTokenAmount } from 'utils/formatTokenAmount'

const PageWrapper = styled.div`
  min-width: 800px;
`

const BadgeWrapper = styled.div`
  font-size: 14px;
`

const BadgeText = styled.div`
  font-weight: 500;
  font-size: 14px;
`
const ResponsiveGrid = styled.div`
  width: 100%;
  display: grid;
  grid-gap: 1em;

  grid-template-columns: 1.5fr repeat(3, 1fr);

  @media screen and (max-width: 900px) {
    grid-template-columns: 1.5fr repeat(3, 1fr);
    & :nth-child(4) {
      display: none;
    }
  }

  @media screen and (max-width: 700px) {
    grid-template-columns: 20px 1.5fr repeat(3, 1fr);
    & :nth-child(4) {
      display: none;
    }
    & :nth-child(5) {
      display: none;
    }
  }
`

// responsive text
const Label = styled(TYPE.label)<{ end?: boolean }>`
  display: flex;
  font-size: 16px;
  justify-content: ${({ end }) => (end ? 'flex-end' : 'flex-start')};
  align-items: center;
`

const ActiveDot = styled.span`
  background-color: ${({ theme }) => theme.success};
  border-radius: 50%;
  height: 8px;
  width: 8px;
  margin-right: 4px;
`

const DarkBadge = styled.div`
  widthL fit-content;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.bg0};
  padding: 4px 6px;
`

export function PositionPage({
  match: {
    params: { positionIndex },
  },
}: RouteComponentProps<{ positionIndex?: string }>) {
  const { account } = useActiveWeb3React()
  const { t } = useTranslation()

  const { loading, positions } = useV3Positions(account ?? undefined)

  const positionDetails = positionIndex && positions ? positions[parseInt(positionIndex)] : undefined

  const { token0: token0Address, token1: token1Address, fee: feeAmount, liquidity, tickLower, tickUpper, tokenId } =
    positionDetails || {}

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  // construct Position from details returned
  const [poolState, pool] = usePool(currency0 ?? undefined, currency1 ?? undefined, feeAmount)
  const position = useMemo(() => {
    if (pool && liquidity && tickLower && tickUpper) {
      return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper])

  const price0Lower = position ? position.token0PriceLower : undefined
  const price0Upper = position ? position.token0PriceUpper : undefined
  const price1Lower = price0Upper ? price0Upper.invert() : undefined
  const price1Upper = price0Lower ? price0Lower.invert() : undefined

  // check if price is within range
  const outOfRange: boolean =
    pool && tickLower && tickUpper ? pool.tickCurrent < tickLower || pool.tickCurrent > tickUpper : false

  // fees
  const [feeValue0, feeValue1] = useV3PositionFees(pool ?? undefined, positionDetails)

  return loading || poolState === PoolState.LOADING || !feeAmount ? (
    <LoadingRows>
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
    </LoadingRows>
  ) : (
    <PageWrapper>
      <AutoColumn gap="lg">
        <AutoColumn gap="sm">
          <RowBetween>
            <RowFixed>
              <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={20} margin={true} />
              <TYPE.label fontSize={'20px'} mr="10px">
                &nbsp;{currency0?.symbol}&nbsp;/&nbsp;{currency1?.symbol}
              </TYPE.label>
              <Badge>
                <BadgeText>{basisPointsToPercent(feeAmount / 100).toSignificant()}%</BadgeText>
              </Badge>
            </RowFixed>
            {tokenId && (
              <ButtonPrimary width="200px" padding="8px" borderRadius="12px" as={Link} to={`/remove/${tokenId}`}>
                Remove liquidity
              </ButtonPrimary>
            )}
          </RowBetween>
          <RowBetween>
            <BadgeWrapper>
              {outOfRange ? (
                <Badge variant={BadgeVariant.WARNING}>
                  <AlertTriangle width={14} height={14} style={{ marginRight: '4px' }} />
                  &nbsp;
                  <BadgeText>{t('Out of range')}</BadgeText>
                </Badge>
              ) : (
                <Badge variant={BadgeVariant.DEFAULT}>
                  <ActiveDot /> &nbsp;
                  <BadgeText>{t('Active')}</BadgeText>
                </Badge>
              )}
            </BadgeWrapper>
          </RowBetween>
        </AutoColumn>
        <DarkCard>
          <AutoColumn gap="lg">
            <ResponsiveGrid>
              <Label>Tokens</Label>
              <Label end={true}>Current</Label>
              <Label end={true}>Fees</Label>
              <Label end={true}>USD Value</Label>
            </ResponsiveGrid>
            <ResponsiveGrid>
              <RowFixed>
                <CurrencyLogo currency={currency0} />
                <TYPE.label ml="10px">{currency0?.symbol}</TYPE.label>
              </RowFixed>
              <Label end={true}>{position?.amount0.toSignificant(4)}</Label>
              <Label end={true}>{feeValue0 ? formatTokenAmount(feeValue0, 4) : '-'}</Label>
              <Label end={true}>-</Label>
            </ResponsiveGrid>
            <ResponsiveGrid>
              <RowFixed>
                <CurrencyLogo currency={currency1} />
                <TYPE.label ml="10px">{currency1?.symbol}</TYPE.label>
              </RowFixed>
              <Label end={true}>{position?.amount1.toSignificant(4)}</Label>
              <Label end={true}>{feeValue1 ? formatTokenAmount(feeValue1, 4) : '-'}</Label>
              <Label end={true}>-</Label>
            </ResponsiveGrid>
          </AutoColumn>
        </DarkCard>
        <DarkCard>
          <AutoColumn gap="lg">
            <TYPE.label>Position Limits</TYPE.label>
            <RowBetween>
              <DarkGreyCard width="49%">
                <AutoColumn gap="sm" justify="flex-start">
                  <TYPE.main>Lower Limit</TYPE.main>
                  <RowFixed>
                    <TYPE.label>{price0Lower?.toSignificant(4)}</TYPE.label>
                    <TYPE.label ml="10px">
                      {currency0?.symbol} / {currency1?.symbol}
                    </TYPE.label>
                  </RowFixed>
                  <RowFixed>
                    <TYPE.label>{price1Lower?.toSignificant(4)}</TYPE.label>
                    <TYPE.label ml="10px">
                      {currency1?.symbol} / {currency0?.symbol}
                    </TYPE.label>
                  </RowFixed>
                  <DarkBadge>
                    <RowFixed>
                      <TYPE.label mr="6px">100%</TYPE.label>
                      <CurrencyLogo currency={currency0} size="16px" />
                      <TYPE.label ml="4px">{currency0?.symbol}</TYPE.label>
                    </RowFixed>
                  </DarkBadge>
                </AutoColumn>
              </DarkGreyCard>
              <DarkGreyCard width="49%">
                <AutoColumn gap="sm" justify="flex-start">
                  <TYPE.main>Lower Limit</TYPE.main>
                  <RowFixed>
                    <TYPE.label>{price0Upper?.toSignificant(4)}</TYPE.label>
                    <TYPE.label ml="10px">
                      {currency0?.symbol} / {currency1?.symbol}
                    </TYPE.label>
                  </RowFixed>
                  <RowFixed>
                    <TYPE.label>{price1Upper?.toSignificant(4)}</TYPE.label>
                    <TYPE.label ml="10px">
                      {currency1?.symbol} / {currency0?.symbol}
                    </TYPE.label>
                  </RowFixed>
                  <DarkBadge>
                    <RowFixed>
                      <TYPE.label mr="6px">100%</TYPE.label>
                      <CurrencyLogo currency={currency1} size="16px" />
                      <TYPE.label ml="4px">{currency1?.symbol}</TYPE.label>
                    </RowFixed>
                  </DarkBadge>
                </AutoColumn>
              </DarkGreyCard>
            </RowBetween>
          </AutoColumn>
        </DarkCard>
      </AutoColumn>
    </PageWrapper>
  )
}
