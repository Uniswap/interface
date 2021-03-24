import Badge, { BadgeVariant } from 'components/Badge'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import React from 'react'
import { AlertTriangle } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { unwrappedToken } from 'utils/wrappedCurrency'
import styled, { keyframes } from 'styled-components'
import { Link } from 'react-router-dom'
import { MEDIA_WIDTHS } from 'theme'
import { Position } from 'types/v3'

const ActiveDot = styled.span`
  background-color: ${({ theme }) => theme.success};
  border-radius: 50%;
  height: 8px;
  width: 8px;
  margin-right: 4px;
`
const Row = styled(Link)`
  align-items: center;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.text1};
  margin: 8px 0;
  padding: 8px;
  text-decoration: none;
  font-weight: 500;
  &:first-of-type {
    margin: 0 0 8px 0;
  }
  &:last-of-type {
    margin: 8px 0 0 0;
  }

  & > div:not(:first-child) {
    text-align: right;
    min-width: 18%;
  }
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    flex-direction: row;
  }
  :hover {
    background-color: ${({ theme }) => theme.bg1};
  }
`
const BadgeText = styled.div`
  font-weight: 500;
  font-size: 14px;
`
const BadgeWrapper = styled.div`
  font-size: 14px;
`
const DataLineItem = styled.div`
  text-align: right;
  font-size: 14px;
`
const DoubleArrow = styled.span`
  color: ${({ theme }) => theme.text3};
`
const DesktopHeader = styled.div`
  display: none;
  font-size: 14px;
  font-weight: 500;
  opacity: 0.6;
  padding: 8px 8px 0 8px;

  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    align-items: center;
    display: flex;
    margin: 0 0 8px 0;
    & > div:first-child {
      flex: 1 1 auto;
    }
    & > div:not(:first-child) {
      text-align: right;
      min-width: 18%;
    }
  }
`
const loadingAnimation = keyframes`
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`

const LoadingRows = styled.div`
  display: grid;
  grid-column-gap: 0.5em;
  grid-row-gap: 0.8em;
  grid-template-columns: repeat(3, 1fr);
  & > div {
    animation: ${loadingAnimation} 1.5s infinite;
    animation-fill-mode: both;
    background: linear-gradient(
      to left,
      ${({ theme }) => theme.bg3} 25%,
      ${({ theme }) => theme.bg5} 50%,
      ${({ theme }) => theme.bg3} 75%
    );
    background-size: 400%;
    border-radius: 0.2em;
    height: 1.4em;
    will-change: background-position;
  }
  & > div:nth-child(4n + 1) {
    grid-column: 1 / 3;
  }
  & > div:nth-child(4n) {
    grid-column: 3 / 4;
    margin-bottom: 2em;
  }
`
const RangeData = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  & > div {
    align-items: center;
    display: flex;
    justify-content: space-between;
    width: 100%;
  }
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    display: block;
    & > div {
      display: block;
    }
  }
`
const AmountData = styled.div`
  display: none;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    display: block;
  }
`
const FeeData = styled.div`
  display: none;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    display: block;
  }
`
const LabelData = styled.div`
  align-items: center;
  display: flex;
  flex: 1 1 auto;
  justify-content: space-between;
  width: 100%;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    display: block;
  }
`
const MobileHeader = styled.div`
  font-weight: medium;
  font-size: 16px;
  margin-bottom: 16px;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    display: none;
  }
`
const PrimaryPositionIdData = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 6px 0 12px 0;
  > * {
    margin-right: 8px;
  }
`

const DataText = styled.div`
  font-weight: 500;
`

export type PositionListProps = React.PropsWithChildren<{
  loading: boolean
  positions: Position[]
  showUnwrapped?: boolean
}>

export default function PositionList({ loading, positions, showUnwrapped }: PositionListProps) {
  const { t } = useTranslation()
  return (
    <>
      <DesktopHeader>
        <div>{t('Position')}</div>
        <div>{t('Range')}</div>
        <div>{t('Liquidity')}</div>
        <div>{t('Fees Earned')}</div>
      </DesktopHeader>
      <MobileHeader>Your positions</MobileHeader>
      {loading ? (
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
        positions.map((position) => {
          const { feeLevel, feesEarned, tokenAmount0, tokenAmount1 } = position
          const symbol0 = tokenAmount0.token.symbol || ''
          const symbol1 = tokenAmount1.token.symbol || ''
          const currency0 = showUnwrapped ? tokenAmount0.token : unwrappedToken(tokenAmount0.token)
          const currency1 = showUnwrapped ? tokenAmount1.token : unwrappedToken(tokenAmount1.token)
          const limitCrossed = tokenAmount0.equalTo(0) || tokenAmount1.equalTo(0)

          const key = `${feeLevel.toFixed()}-${symbol0}-${tokenAmount0.toFixed(2)}-${symbol1}-${tokenAmount1.toFixed(
            2
          )}`

          return (
            <Row key={key} to="/asdf">
              <LabelData>
                <PrimaryPositionIdData>
                  <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={16} margin />
                  <DataText>
                    &nbsp;{symbol0}&nbsp;/&nbsp;{symbol1}
                  </DataText>
                  &nbsp;
                  <Badge>
                    <BadgeText>{feeLevel.toSignificant(2)}%</BadgeText>
                  </Badge>
                </PrimaryPositionIdData>
                <BadgeWrapper>
                  {limitCrossed ? (
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
              </LabelData>
              <RangeData>
                <DataLineItem>
                  1,672 <DoubleArrow>↔</DoubleArrow> 1,688 {symbol0}&nbsp;/&nbsp;{symbol1}
                </DataLineItem>
                <DataLineItem>
                  0.0002 <DoubleArrow>↔</DoubleArrow> 0.0001 {symbol1}&nbsp;/&nbsp;{symbol0}
                </DataLineItem>
              </RangeData>
              <AmountData>
                <DataLineItem>
                  {tokenAmount0.toSignificant()}&nbsp;{symbol0}
                </DataLineItem>
                <DataLineItem>
                  {tokenAmount1.toSignificant()}&nbsp;{symbol1}
                </DataLineItem>
              </AmountData>
              <FeeData>
                <DataLineItem>
                  {feesEarned[symbol0]}&nbsp;{symbol0}
                </DataLineItem>
                <DataLineItem>
                  {feesEarned[symbol1]}&nbsp;{symbol1}
                </DataLineItem>
              </FeeData>
            </Row>
          )
        })
      )}
    </>
  )
}
