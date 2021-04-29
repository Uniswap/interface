import React, { useCallback, useMemo, useState } from 'react'
import { NonfungiblePositionManager, Pool, Position } from '@uniswap/v3-sdk'
import { PoolState, usePool } from 'hooks/usePools'
import { useToken } from 'hooks/Tokens'
import { useV3PositionFromTokenId } from 'hooks/useV3Positions'
import { Link, RouteComponentProps } from 'react-router-dom'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { LoadingRows } from './styleds'
import styled from 'styled-components'
import { AutoColumn } from 'components/Column'
import { RowBetween, RowFixed } from 'components/Row'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { ButtonText, TYPE } from 'theme'
import Badge, { BadgeVariant } from 'components/Badge'
import { basisPointsToPercent, calculateGasMargin } from 'utils'
import { ButtonConfirmed, ButtonPrimary } from 'components/Button'
import { DarkCard, DarkGreyCard } from 'components/Card'
import CurrencyLogo from 'components/CurrencyLogo'
import { AlertTriangle, ToggleLeft, ToggleRight } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { currencyId } from 'utils/currencyId'
import { formatTokenAmount } from 'utils/formatTokenAmount'
import { useV3PositionFees } from 'hooks/useV3PositionFees'
import { BigNumber } from '@ethersproject/bignumber'
import { WETH9, Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useActiveWeb3React } from 'hooks'
import { useV3NFTPositionManagerContract } from 'hooks/useContract'
import { useIsTransactionPending, useTransactionAdder } from 'state/transactions/hooks'
import ReactGA from 'react-ga'
import { TransactionResponse } from '@ethersproject/providers'
import { Dots } from 'components/swap/styleds'
import { getPriceOrderingFromPositionForUI } from '../../components/PositionListItem'

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

  grid-template-columns: 1.5fr repeat(2, 1fr);

  @media screen and (max-width: 900px) {
    grid-template-columns: 1.5fr repeat(2, 1fr);
    & :nth-child(4) {
      display: none;
    }
  }

  @media screen and (max-width: 700px) {
    grid-template-columns: 20px 1.5fr repeat(2, 1fr);
    & :nth-child(4) {
      display: none;
    }
    & :nth-child(5) {
      display: none;
    }
  }
`

// responsive text
// disable the warning because we don't use the end prop, we just want to filter it out
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Label = styled(({ end, ...props }) => <TYPE.label {...props} />)<{ end?: boolean }>`
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

export const DarkBadge = styled.div`
  width: fit-content;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.bg0};
  padding: 4px 6px;
`

function CurrentPriceCard({
  inverted,
  pool,
  currencyQuote,
  currencyBase,
}: {
  inverted?: boolean
  pool?: Pool | null
  currencyQuote?: Currency
  currencyBase?: Currency
}) {
  if (!pool || !currencyQuote || !currencyBase) {
    return null
  }

  return (
    <DarkGreyCard width="32%">
      <AutoColumn gap="sm" justify="flex-start">
        <TYPE.main>Current</TYPE.main>
        <RowFixed>
          <TYPE.label>
            {(inverted ? pool.token1Price : pool.token0Price).toSignificant(4)} {currencyQuote?.symbol} / 1{' '}
            {currencyBase?.symbol}
          </TYPE.label>
        </RowFixed>
      </AutoColumn>
    </DarkGreyCard>
  )
}

export function PositionPage({
  match: {
    params: { tokenId: tokenIdFromUrl },
  },
}: RouteComponentProps<{ tokenId?: string }>) {
  const { t } = useTranslation()
  const { chainId, account, library } = useActiveWeb3React()

  const parsedTokenId = tokenIdFromUrl ? BigNumber.from(tokenIdFromUrl) : undefined
  const { loading, position: positionDetails } = useV3PositionFromTokenId(parsedTokenId)

  const { token0: token0Address, token1: token1Address, fee: feeAmount, liquidity, tickLower, tickUpper, tokenId } =
    positionDetails || {}

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  // construct Position from details returned
  const [poolState, pool] = usePool(currency0 ?? undefined, currency1 ?? undefined, feeAmount)
  const position = useMemo(() => {
    if (pool && liquidity && typeof tickLower === 'number' && typeof tickUpper === 'number') {
      return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper])

  let { priceLower, priceUpper, base, quote } = getPriceOrderingFromPositionForUI(position)
  const [manuallyInverted, setManuallyInverted] = useState(false)
  // handle manual inversion
  if (manuallyInverted) {
    ;[priceLower, priceUpper, base, quote] = [priceUpper?.invert(), priceLower?.invert(), quote, base]
  }
  const inverted = token1 ? base?.equals(token1) : undefined
  const currencyQuote = inverted ? currency0 : currency1
  const currencyBase = inverted ? currency1 : currency0

  // check if price is within range
  const inRange: boolean =
    pool && typeof tickLower === 'number' && typeof tickUpper === 'number'
      ? pool.tickCurrent >= tickLower && pool.tickCurrent < tickUpper
      : false
  const below = pool && typeof tickLower === 'number' ? pool.tickCurrent < tickLower : false
  const above = pool && typeof tickUpper === 'number' ? pool.tickCurrent >= tickUpper : false

  // fees
  const [feeValue0, feeValue1] = useV3PositionFees(pool ?? undefined, positionDetails)

  const [collecting, setCollecting] = useState<boolean>(false)
  const [collectMigrationHash, setCollectMigrationHash] = useState<string | null>(null)
  const isCollectPending = useIsTransactionPending(collectMigrationHash ?? undefined)

  const addTransaction = useTransactionAdder()
  const positionManager = useV3NFTPositionManagerContract()
  const collect = useCallback(() => {
    if (!chainId || !feeValue0 || !feeValue1 || !positionManager || !account || !tokenId || !library) return

    setCollecting(true)

    const { calldata, value } = NonfungiblePositionManager.collectCallParameters({
      tokenId: tokenId.toString(),
      expectedCurrencyOwed0: feeValue0.token.equals(WETH9[chainId]) ? CurrencyAmount.ether(feeValue0.raw) : feeValue0,
      expectedCurrencyOwed1: feeValue1.token.equals(WETH9[chainId]) ? CurrencyAmount.ether(feeValue1.raw) : feeValue1,
      recipient: account,
    })

    const txn = {
      to: positionManager.address,
      data: calldata,
      value,
    }

    library
      .getSigner()
      .estimateGas(txn)
      .then((estimate) => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(estimate),
        }

        return library
          .getSigner()
          .sendTransaction(newTxn)
          .then((response: TransactionResponse) => {
            setCollectMigrationHash(response.hash)
            setCollecting(false)

            ReactGA.event({
              category: 'Liquidity',
              action: 'CollectV3',
              label: [feeValue0.token.symbol, feeValue1.token.symbol].join('/'),
            })

            addTransaction(response, {
              summary: `Collect ${feeValue0.token.symbol}/${feeValue1.token.symbol} fees`,
            })
          })
      })
      .catch((error) => {
        setCollecting(false)
        console.error(error)
      })
  }, [chainId, feeValue0, feeValue1, positionManager, account, tokenId, addTransaction, library])

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
              <DoubleCurrencyLogo currency0={currencyBase} currency1={currencyQuote} size={20} margin={true} />
              <TYPE.label fontSize={'20px'} mr="10px">
                &nbsp;{currencyQuote?.symbol}&nbsp;/&nbsp;{currencyBase?.symbol}
              </TYPE.label>
              <Badge>
                <BadgeText>{basisPointsToPercent(feeAmount / 100).toSignificant()}%</BadgeText>
              </Badge>
            </RowFixed>
            <RowFixed>
              {feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0) || !!collectMigrationHash ? (
                <ButtonConfirmed
                  disabled={collecting || !!collectMigrationHash}
                  confirmed={!!collectMigrationHash && !isCollectPending}
                  mr="15px"
                  width="175px"
                  padding="8px"
                  style={{ borderRadius: '12px' }}
                  onClick={collect}
                >
                  {!!collectMigrationHash && !isCollectPending ? (
                    'Collected'
                  ) : isCollectPending || collecting ? (
                    <Dots>Collecting</Dots>
                  ) : (
                    'Collect fees'
                  )}
                </ButtonConfirmed>
              ) : null}
              {currency0 && currency1 && feeAmount && tokenId ? (
                <Link to={`/increase/${currencyId(currency0)}/${currencyId(currency1)}/${feeAmount}/${tokenId}`}>
                  <ButtonPrimary mr="15px" width="175px" padding="8px" borderRadius="12px">
                    Add liquidity
                  </ButtonPrimary>
                </Link>
              ) : null}
              {tokenId && (
                <Link to={`/remove/${tokenId}`}>
                  <ButtonPrimary width="175px" padding="8px" borderRadius="12px">
                    Remove liquidity
                  </ButtonPrimary>
                </Link>
              )}
            </RowFixed>
          </RowBetween>
          <RowBetween>
            <BadgeWrapper>
              {inRange ? (
                <Badge variant={BadgeVariant.DEFAULT}>
                  <ActiveDot /> &nbsp;
                  <BadgeText>{t('Active')}</BadgeText>
                </Badge>
              ) : (
                <Badge variant={BadgeVariant.WARNING}>
                  <AlertTriangle width={14} height={14} style={{ marginRight: '4px' }} />
                  &nbsp;
                  <BadgeText>{t('Out of range')}</BadgeText>
                </Badge>
              )}
            </BadgeWrapper>
          </RowBetween>
        </AutoColumn>
        <DarkCard>
          <AutoColumn gap="lg">
            <ResponsiveGrid>
              <Label>Tokens</Label>
              <Label end={true}>Liquidity</Label>
              <Label end={true}>Fees</Label>
            </ResponsiveGrid>
            <ResponsiveGrid>
              <RowFixed>
                <CurrencyLogo currency={currencyQuote} />
                <TYPE.label ml="10px">{currencyQuote?.symbol}</TYPE.label>
              </RowFixed>
              <Label end={true}>
                {inverted ? position?.amount0.toSignificant(4) : position?.amount1.toSignificant(4)}
              </Label>
              <Label end={true}>
                {inverted
                  ? feeValue0
                    ? formatTokenAmount(feeValue0, 4)
                    : '-'
                  : feeValue1
                  ? formatTokenAmount(feeValue1, 4)
                  : '-'}
              </Label>
            </ResponsiveGrid>
            <ResponsiveGrid>
              <RowFixed>
                <CurrencyLogo currency={currencyBase} />
                <TYPE.label ml="10px">{currencyBase?.symbol}</TYPE.label>
              </RowFixed>
              <Label end={true}>
                {inverted ? position?.amount1.toSignificant(4) : position?.amount0.toSignificant(4)}
              </Label>

              <Label end={true}>
                {inverted
                  ? feeValue1
                    ? formatTokenAmount(feeValue1, 4)
                    : '-'
                  : feeValue0
                  ? formatTokenAmount(feeValue0, 4)
                  : '-'}
              </Label>
            </ResponsiveGrid>
          </AutoColumn>
        </DarkCard>
        <DarkCard>
          <AutoColumn gap="lg">
            <TYPE.label display="flex">
              Position Limits
              <ButtonText style={{ marginLeft: '10px', color: 'inherit' }}>
                {manuallyInverted ? (
                  <ToggleLeft onClick={() => setManuallyInverted(false)} />
                ) : (
                  <ToggleRight onClick={() => setManuallyInverted(true)} />
                )}
              </ButtonText>
            </TYPE.label>

            {below && (
              <CurrentPriceCard
                inverted={inverted}
                pool={pool}
                currencyQuote={currencyQuote}
                currencyBase={currencyBase}
              />
            )}

            <RowBetween>
              <DarkGreyCard width="32%">
                <AutoColumn gap="sm" justify="flex-start">
                  <TYPE.main>Lower</TYPE.main>
                  <RowFixed>
                    <TYPE.label>
                      {priceLower?.toSignificant(4)} {currencyQuote?.symbol} / 1 {currencyBase?.symbol}
                    </TYPE.label>
                  </RowFixed>
                  <DarkBadge>
                    <RowFixed>
                      <TYPE.label mr="6px">100%</TYPE.label>
                      <CurrencyLogo currency={inverted ? currency1 : currency0} size="16px" />
                      <TYPE.label ml="4px">{inverted ? currency1?.symbol : currency0?.symbol}</TYPE.label>
                    </RowFixed>
                  </DarkBadge>
                </AutoColumn>
              </DarkGreyCard>

              {inRange && (
                <CurrentPriceCard
                  inverted={inverted}
                  pool={pool}
                  currencyQuote={currencyQuote}
                  currencyBase={currencyBase}
                />
              )}

              <DarkGreyCard width="32%">
                <AutoColumn gap="sm" justify="flex-start">
                  <TYPE.main>Upper</TYPE.main>
                  <RowFixed>
                    <TYPE.label>
                      {priceUpper?.toSignificant(4)} {currencyQuote?.symbol} / 1 {currencyBase?.symbol}
                    </TYPE.label>
                  </RowFixed>
                  <DarkBadge>
                    <RowFixed>
                      <TYPE.label mr="6px">100%</TYPE.label>
                      <CurrencyLogo currency={inverted ? currency0 : currency1} size="16px" />
                      <TYPE.label ml="4px">{inverted ? currency0?.symbol : currency1?.symbol}</TYPE.label>
                    </RowFixed>
                  </DarkBadge>
                </AutoColumn>
              </DarkGreyCard>

              {above && (
                <CurrentPriceCard
                  inverted={inverted}
                  pool={pool}
                  currencyQuote={currencyQuote}
                  currencyBase={currencyBase}
                />
              )}
            </RowBetween>
          </AutoColumn>
        </DarkCard>
      </AutoColumn>
    </PageWrapper>
  )
}
