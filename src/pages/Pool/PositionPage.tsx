import React, { useCallback, useMemo, useState } from 'react'
import { NonfungiblePositionManager, Pool, Position } from '@uniswap/v3-sdk'

import { PoolState, usePool } from 'hooks/usePools'
import { useToken } from 'hooks/Tokens'
import { useV3PositionFromTokenId } from 'hooks/useV3Positions'
import { Link, RouteComponentProps } from 'react-router-dom'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { usePositionTokenURI } from '../../hooks/usePositionTokenURI'
import { LoadingRows } from './styleds'
import styled from 'styled-components'
import { AutoColumn } from 'components/Column'
import { RowBetween, RowFixed } from 'components/Row'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { TYPE } from 'theme'
import Badge from 'components/Badge'
import { calculateGasMargin } from 'utils'
import { ButtonConfirmed, ButtonPrimary, ButtonGray } from 'components/Button'
import { DarkCard, LightCard } from 'components/Card'
import CurrencyLogo from 'components/CurrencyLogo'
import { useTranslation } from 'react-i18next'
import { currencyId } from 'utils/currencyId'
import { formatTokenAmount } from 'utils/formatTokenAmount'
import { useV3PositionFees } from 'hooks/useV3PositionFees'
import { BigNumber } from '@ethersproject/bignumber'
import { WETH9, Currency, CurrencyAmount, Percent, Fraction } from '@uniswap/sdk-core'
import { useActiveWeb3React } from 'hooks'
import { useV3NFTPositionManagerContract } from 'hooks/useContract'
import { useIsTransactionPending, useTransactionAdder } from 'state/transactions/hooks'
import ReactGA from 'react-ga'
import { TransactionResponse } from '@ethersproject/providers'
import { Dots } from 'components/swap/styleds'
import { getPriceOrderingFromPositionForUI } from '../../components/PositionListItem'

import useTheme from '../../hooks/useTheme'
import { MinusCircle, PlusCircle } from 'react-feather'

import RateToggle from '../../components/RateToggle'
import { useSingleCallResult } from 'state/multicall/hooks'

import RangeBadge from '../../components/Badge/RangeBadge'
import useUSDCPrice from 'hooks/useUSDCPrice'

const PageWrapper = styled.div`
  min-width: 800px;
  max-width: 960px;
`

const BadgeText = styled.div`
  font-weight: 500;
  font-size: 14px;
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

export const DarkBadge = styled.div`
  width: fit-content;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.bg0};
  padding: 4px 6px;
`

const ExtentsText = styled.span`
  color: ${({ theme }) => theme.text3};
  font-size: 14px;
  text-align: center;
  margin-right: 4px;
`

const HoverText = styled(TYPE.main)`
  text-decoration: none;
  color: ${({ theme }) => theme.text3};
  :hover {
    color: ${({ theme }) => theme.text1};
    text-decoration: none;
  }
`

const DoubleArrow = styled.span`
  color: ${({ theme }) => theme.text3};
  margin: 0 1rem;
`

const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  border-radius: 12px;
  padding: 6px 8px;
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex: 1 1 auto;
    width: 49%;
  `};
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
  const { t } = useTranslation()
  if (!pool || !currencyQuote || !currencyBase) {
    return null
  }

  return (
    <LightCard padding="12px ">
      <AutoColumn gap="md" justify="center">
        <ExtentsText>{t('Current price')}</ExtentsText>
        <TYPE.label textAlign="center">
          {(inverted ? pool.token1Price : pool.token0Price).toSignificant(4)} {currencyQuote?.symbol}
        </TYPE.label>
      </AutoColumn>
    </LightCard>
  )
}

export function PositionPage({
  match: {
    params: { tokenId: tokenIdFromUrl },
  },
}: RouteComponentProps<{ tokenId?: string }>) {
  const { t } = useTranslation()
  const { chainId, account, library } = useActiveWeb3React()
  const theme = useTheme()

  const parsedTokenId = tokenIdFromUrl ? BigNumber.from(tokenIdFromUrl) : undefined
  const { loading, position: positionDetails } = useV3PositionFromTokenId(parsedTokenId)

  const { token0: token0Address, token1: token1Address, fee: feeAmount, liquidity, tickLower, tickUpper, tokenId } =
    positionDetails || {}

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const metadata = usePositionTokenURI(parsedTokenId)

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

  // keep will need to be able to draw the range visualization
  // const below = pool && typeof tickLower === 'number' ? pool.tickCurrent < tickLower : false
  // const above = pool && typeof tickUpper === 'number' ? pool.tickCurrent >= tickUpper : false

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

  const owner = useSingleCallResult(!!tokenId ? positionManager : null, 'ownerOf', [tokenId]).result?.[0]
  const ownsNFT = owner === account || positionDetails?.operator === account

  const price0 = useUSDCPrice(token0 ?? undefined)
  const price1 = useUSDCPrice(token1 ?? undefined)

  const fiatValueOfFees: CurrencyAmount | null = useMemo(() => {
    if (!price0 || !price1 || !feeValue0 || !feeValue1) return null
    const amount0 = price0.quote(feeValue0)
    const amount1 = price1.quote(feeValue1)
    return amount0.add(amount1)
  }, [price0, price1, feeValue0, feeValue1])

  const fiatValueOfLiquidity: CurrencyAmount | null = useMemo(() => {
    if (!price0 || !price1 || !position) return null
    const amount0 = price0.quote(position.amount0)
    const amount1 = price1.quote(position.amount1)
    return amount0.add(amount1)
  }, [price0, price1, position])

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
      <AutoColumn gap="md">
        <AutoColumn gap="sm">
          <Link style={{ textDecoration: 'none', width: 'fit-content', marginBottom: '0.5rem' }} to="/pool">
            <HoverText>{'← Back to overview'}</HoverText>
          </Link>
          <RowBetween>
            <RowFixed>
              <DoubleCurrencyLogo currency0={currencyBase} currency1={currencyQuote} size={24} margin={true} />
              <TYPE.label fontSize={'24px'} mr="10px">
                &nbsp;{currencyQuote?.symbol}&nbsp;/&nbsp;{currencyBase?.symbol}
              </TYPE.label>
              <Badge style={{ marginRight: '8px' }}>
                <BadgeText>{new Percent(feeAmount, 1_000_000).toSignificant()}%</BadgeText>
              </Badge>
              <RangeBadge inRange={inRange} />
            </RowFixed>

            {ownsNFT && (
              <RowFixed>
                {currency0 && currency1 && feeAmount && tokenId ? (
                  <ButtonGray
                    as={Link}
                    to={`/increase/${currencyId(currency0)}/${currencyId(currency1)}/${feeAmount}/${tokenId}`}
                    width="fit-content"
                    padding="6px 8px"
                    borderRadius="12px"
                    style={{ marginRight: '8px' }}
                  >
                    <PlusCircle size={16} style={{ marginRight: '8px' }} />{' '}
                    <TYPE.body color={theme.text1}>{t('Add Liquidity')}</TYPE.body>
                  </ButtonGray>
                ) : null}
                {tokenId && (
                  <ResponsiveButtonPrimary
                    as={Link}
                    to={`/remove/${tokenId}`}
                    width="fit-content"
                    padding="6px 8px"
                    borderRadius="12px"
                  >
                    <MinusCircle size={16} style={{ marginRight: '8px' }} /> {t('Remove Liquidity')}
                  </ResponsiveButtonPrimary>
                )}
              </RowFixed>
            )}
          </RowBetween>
          <RowBetween></RowBetween>
        </AutoColumn>
        <RowBetween align="flex-start">
          {'result' in metadata ? (
            <DarkCard
              width="100%"
              height="100%"
              style={{
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'space-around',
                marginRight: '12px',
                maxWidth: '360px',
              }}
            >
              <div style={{ marginRight: 12 }}>
                <img height="400px" src={metadata.result.image} />
              </div>
            </DarkCard>
          ) : null}
          <AutoColumn gap="sm" style={{ width: '100%' }}>
            <DarkCard>
              <AutoColumn gap="lg" style={{ width: '100%' }}>
                <AutoColumn gap="md">
                  <Label>Position liquidity</Label>
                  {fiatValueOfLiquidity?.greaterThan(new Fraction(1, 100)) && (
                    <TYPE.largeHeader fontSize="36px" fontWeight={500}>
                      ${fiatValueOfLiquidity.toFixed(2)}
                    </TYPE.largeHeader>
                  )}
                </AutoColumn>

                <LightCard padding="12px 16px">
                  <AutoColumn gap="md">
                    <RowBetween>
                      <RowFixed>
                        <CurrencyLogo currency={currencyQuote} size={'20px'} style={{ marginRight: '0.5rem' }} />
                        <TYPE.main>
                          {inverted ? position?.amount0.toSignificant(4) : position?.amount1.toSignificant(4)}
                        </TYPE.main>
                      </RowFixed>
                      <TYPE.main>{currencyQuote?.symbol}</TYPE.main>
                    </RowBetween>
                    <RowBetween>
                      <RowFixed>
                        <CurrencyLogo currency={currencyBase} size={'20px'} style={{ marginRight: '0.5rem' }} />
                        <TYPE.main>
                          {inverted ? position?.amount1.toSignificant(4) : position?.amount0.toSignificant(4)}
                        </TYPE.main>
                      </RowFixed>
                      <TYPE.main>{currencyBase?.symbol}</TYPE.main>
                    </RowBetween>
                  </AutoColumn>
                </LightCard>
              </AutoColumn>
            </DarkCard>
            <span style={{ width: '24px' }}></span>
            <DarkCard>
              <AutoColumn gap="lg" style={{ width: '100%' }}>
                <AutoColumn gap="md">
                  <RowBetween style={{ alignItems: 'flex-start' }}>
                    <AutoColumn gap="md">
                      <Label>Fees Earned</Label>
                      {fiatValueOfFees?.greaterThan(new Fraction(1, 100)) && (
                        <TYPE.largeHeader color={theme.green1} fontSize="36px" fontWeight={500}>
                          ${fiatValueOfFees.toFixed(2)}
                        </TYPE.largeHeader>
                      )}
                    </AutoColumn>
                    {feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0) || !!collectMigrationHash ? (
                      <ButtonConfirmed
                        disabled={collecting || !!collectMigrationHash}
                        confirmed={!!collectMigrationHash && !isCollectPending}
                        width="fit-content"
                        style={{ borderRadius: '12px' }}
                        padding="4px 8px"
                        onClick={collect}
                      >
                        {!!collectMigrationHash && !isCollectPending ? (
                          <TYPE.main color={theme.text1}> Collected</TYPE.main>
                        ) : isCollectPending || collecting ? (
                          <TYPE.main color={theme.text1}>
                            {' '}
                            <Dots>Collecting</Dots>
                          </TYPE.main>
                        ) : (
                          <>
                            <TYPE.main color={theme.white}>Collect fees</TYPE.main>
                          </>
                        )}
                      </ButtonConfirmed>
                    ) : null}
                  </RowBetween>
                </AutoColumn>

                <LightCard padding="12px 16px">
                  <AutoColumn gap="md">
                    <RowBetween>
                      <RowFixed>
                        <CurrencyLogo currency={currencyQuote} size={'20px'} style={{ marginRight: '0.5rem' }} />
                        <TYPE.main>
                          {inverted
                            ? feeValue0
                              ? formatTokenAmount(feeValue0, 4)
                              : '-'
                            : feeValue1
                            ? formatTokenAmount(feeValue1, 4)
                            : '-'}
                        </TYPE.main>
                      </RowFixed>
                      <TYPE.main>{currencyQuote?.symbol}</TYPE.main>
                    </RowBetween>
                    <RowBetween>
                      <RowFixed>
                        <CurrencyLogo currency={currencyBase} size={'20px'} style={{ marginRight: '0.5rem' }} />
                        <TYPE.main>
                          {inverted
                            ? feeValue0
                              ? formatTokenAmount(feeValue1, 4)
                              : '-'
                            : feeValue1
                            ? formatTokenAmount(feeValue0, 4)
                            : '-'}
                        </TYPE.main>
                      </RowFixed>
                      <TYPE.main>{currencyBase?.symbol}</TYPE.main>
                    </RowBetween>
                  </AutoColumn>
                </LightCard>
              </AutoColumn>
            </DarkCard>
          </AutoColumn>
        </RowBetween>
        <DarkCard>
          <AutoColumn gap="md">
            <RowBetween>
              <Label display="flex" style={{ marginRight: '12px' }}>
                Price range
              </Label>

              <RowFixed>
                <RangeBadge inRange={inRange} />
                <span style={{ width: '8px' }} />
                {currencyBase && currencyQuote && (
                  <RateToggle
                    currencyA={currencyBase}
                    currencyB={currencyQuote}
                    handleRateToggle={() => setManuallyInverted(!manuallyInverted)}
                  />
                )}
              </RowFixed>
            </RowBetween>

            <RowBetween>
              <LightCard padding="12px" width="100%">
                <AutoColumn gap="12px" justify="center">
                  <ExtentsText>Min</ExtentsText>
                  <RowFixed>
                    <TYPE.label textAlign="center">
                      {priceLower?.toSignificant(4)} {currencyQuote?.symbol}
                    </TYPE.label>
                  </RowFixed>
                  <TYPE.subHeader color={theme.text3} textAlign="center">
                    Your position will be <CurrencyLogo currency={inverted ? currency1 : currency0} size="12px" /> 100%{' '}
                    {inverted ? currency1?.symbol : currency0?.symbol} at this price
                  </TYPE.subHeader>
                </AutoColumn>
              </LightCard>

              <DoubleArrow>⟷</DoubleArrow>
              <LightCard padding="12px" width="100%">
                <AutoColumn gap="12px" justify="center">
                  <ExtentsText>Max</ExtentsText>
                  <RowFixed>
                    <TYPE.label textAlign="center">
                      {priceUpper?.toSignificant(4)} {currencyQuote?.symbol}
                    </TYPE.label>
                  </RowFixed>
                  <TYPE.subHeader color={theme.text3} textAlign="center">
                    Your position will be <CurrencyLogo currency={inverted ? currency0 : currency1} size="12px" /> 100%{' '}
                    {inverted ? currency0?.symbol : currency1?.symbol} at this price
                  </TYPE.subHeader>
                </AutoColumn>
              </LightCard>
            </RowBetween>
            <CurrentPriceCard
              inverted={inverted}
              pool={pool}
              currencyQuote={currencyQuote}
              currencyBase={currencyBase}
            />
          </AutoColumn>
        </DarkCard>
      </AutoColumn>
    </PageWrapper>
  )
}
