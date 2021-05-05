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
import { ExternalLink, HideExtraSmall, TYPE } from 'theme'
import Badge from 'components/Badge'
import { calculateGasMargin, getEtherscanLink } from 'utils'
import { ButtonConfirmed, ButtonPrimary, ButtonGray } from 'components/Button'
import { DarkCard, DarkGreyCard, LightCard } from 'components/Card'
import CurrencyLogo from 'components/CurrencyLogo'
import { useTranslation } from 'react-i18next'
import { currencyId } from 'utils/currencyId'
import { formatTokenAmount } from 'utils/formatTokenAmount'
import { useV3PositionFees } from 'hooks/useV3PositionFees'
import { BigNumber } from '@ethersproject/bignumber'
import { WETH9, Currency, CurrencyAmount, Percent, Fraction, Price } from '@uniswap/sdk-core'
import { useActiveWeb3React } from 'hooks'
import { useV3NFTPositionManagerContract } from 'hooks/useContract'
import { useIsTransactionPending, useTransactionAdder } from 'state/transactions/hooks'
import ReactGA from 'react-ga'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import { TransactionResponse } from '@ethersproject/providers'
import { Dots } from 'components/swap/styleds'
import { getPriceOrderingFromPositionForUI } from '../../components/PositionListItem'
import useTheme from '../../hooks/useTheme'
import RateToggle from '../../components/RateToggle'
import { useSingleCallResult } from 'state/multicall/hooks'
import RangeBadge from '../../components/Badge/RangeBadge'
import useUSDCPrice from 'hooks/useUSDCPrice'
import Loader from 'components/Loader'

const PageWrapper = styled.div`
  min-width: 800px;
  max-width: 960px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    min-width: 680px;
    max-width: 680px;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    min-width: 600px;
    max-width: 600px;
  `};

  @media only screen and (max-width: 620px) {
    min-width: 500px;
    max-width: 500px;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    min-width: 340px;
    max-width: 340px;
  `};
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
  color: ${({ theme }) => theme.text2};
  font-size: 14px;
  text-align: center;
  margin-right: 4px;
  font-weight: 500;
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
const ResponsiveRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    align-items: flex-start;
    row-gap: 16px;
    width: 100%:
  `};
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
      <AutoColumn gap="8px" justify="center">
        <ExtentsText>{t('Current price')}</ExtentsText>
        <TYPE.mediumHeader textAlign="center">
          {(inverted ? pool.token1Price : pool.token0Price).toSignificant(4)}{' '}
        </TYPE.mediumHeader>
        <ExtentsText>{currencyQuote?.symbol + ' / ' + currencyBase?.symbol}</ExtentsText>
      </AutoColumn>
    </LightCard>
  )
}

function getRatio(lower: Price, current: Price, upper: Price) {
  try {
    if (!current.greaterThan(lower)) {
      return 100
    } else if (!current.lessThan(upper)) {
      return 0
    }

    const a = Number.parseFloat(lower.toSignificant(15))
    const b = Number.parseFloat(upper.toSignificant(15))
    const c = Number.parseFloat(current.toSignificant(15))

    const ratio = Math.floor((1 / ((Math.sqrt(a * b) - Math.sqrt(b * c)) / (c - Math.sqrt(b * c)) + 1)) * 100)

    if (ratio < 0 || ratio > 100) {
      throw Error('Out of range')
    }

    return ratio
  } catch {
    return undefined
  }
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

  const removed = liquidity?.eq(0)

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
  const below = pool && typeof tickLower === 'number' ? pool.tickCurrent < tickLower : undefined
  const above = pool && typeof tickUpper === 'number' ? pool.tickCurrent >= tickUpper : undefined
  const inRange: boolean = typeof below === 'boolean' && typeof above === 'boolean' ? !below && !above : false

  const ratio = useMemo(() => {
    return priceLower && pool && priceUpper
      ? getRatio(
          inverted ? priceUpper.invert() : priceLower,
          pool.token0Price,
          inverted ? priceLower.invert() : priceUpper
        )
      : undefined
  }, [inverted, pool, priceLower, priceUpper])

  // fees
  const [feeValue0, feeValue1] = useV3PositionFees(pool ?? undefined, positionDetails)

  const [collecting, setCollecting] = useState<boolean>(false)
  const [collectMigrationHash, setCollectMigrationHash] = useState<string | null>(null)
  const isCollectPending = useIsTransactionPending(collectMigrationHash ?? undefined)
  const [showConfirm, setShowConfirm] = useState(false)

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

  function modalHeader() {
    return (
      <AutoColumn gap={'md'} style={{ marginTop: '20px' }}>
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
        <TYPE.italic>Collecting fees will withdraw currently available fees for you.</TYPE.italic>
        <ButtonPrimary onClick={collect}>Collect</ButtonPrimary>
      </AutoColumn>
    )
  }

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
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={() => setShowConfirm(false)}
        attemptingTxn={collecting}
        hash={collectMigrationHash ?? ''}
        content={() => (
          <ConfirmationModalContent
            title={'Claim fees'}
            onDismiss={() => setShowConfirm(false)}
            topContent={modalHeader}
          />
        )}
        pendingText={'Collecting fees'}
      />
      <AutoColumn gap="md">
        <AutoColumn gap="sm">
          <Link style={{ textDecoration: 'none', width: 'fit-content', marginBottom: '0.5rem' }} to="/pool">
            <HoverText>{'← Back to Pools Overview'}</HoverText>
          </Link>
          <ResponsiveRow>
            <RowFixed>
              <DoubleCurrencyLogo currency0={currencyBase} currency1={currencyQuote} size={24} margin={true} />
              <TYPE.label fontSize={'24px'} mr="10px">
                &nbsp;{currencyQuote?.symbol}&nbsp;/&nbsp;{currencyBase?.symbol}
              </TYPE.label>
              <Badge style={{ marginRight: '8px' }}>
                <BadgeText>{new Percent(feeAmount, 1_000_000).toSignificant()}%</BadgeText>
              </Badge>
              <RangeBadge removed={removed} inRange={inRange} />
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
                    {t('Add Liquidity')}
                  </ButtonGray>
                ) : null}
                {tokenId && !removed ? (
                  <ResponsiveButtonPrimary
                    as={Link}
                    to={`/remove/${tokenId}`}
                    width="fit-content"
                    padding="6px 8px"
                    borderRadius="12px"
                  >
                    {t('Remove Liquidity')}
                  </ResponsiveButtonPrimary>
                ) : null}
              </RowFixed>
            )}
          </ResponsiveRow>
          <RowBetween></RowBetween>
        </AutoColumn>
        <ResponsiveRow align="flex-start">
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
              }}
            >
              <div style={{ marginRight: 12 }}>
                <img height="400px" src={metadata.result.image} />
              </div>
              {typeof chainId === 'number' && owner && !ownsNFT ? (
                <ExternalLink href={getEtherscanLink(chainId, owner, 'address')}>Owner</ExternalLink>
              ) : null}
            </DarkCard>
          ) : (
            <DarkCard
              width="100%"
              height="100%"
              style={{
                marginRight: '12px',
                minWidth: '340px',
              }}
            >
              <Loader />
            </DarkCard>
          )}
          <AutoColumn gap="sm" style={{ width: '100%', height: '100%' }}>
            <DarkCard>
              <AutoColumn gap="md" style={{ width: '100%' }}>
                <AutoColumn gap="md">
                  <Label>Liquidity</Label>
                  {fiatValueOfLiquidity?.greaterThan(new Fraction(1, 100)) ? (
                    <TYPE.largeHeader fontSize="36px" fontWeight={500}>
                      ${fiatValueOfLiquidity.toFixed(2)}
                    </TYPE.largeHeader>
                  ) : (
                    <TYPE.largeHeader color={theme.text1} fontSize="36px" fontWeight={500}>
                      $-
                    </TYPE.largeHeader>
                  )}
                </AutoColumn>
                <LightCard padding="12px 16px">
                  <AutoColumn gap="md">
                    <RowBetween>
                      <RowFixed>
                        <CurrencyLogo currency={currencyQuote} size={'20px'} style={{ marginRight: '0.5rem' }} />
                        <TYPE.main>{currencyQuote?.symbol}</TYPE.main>
                      </RowFixed>
                      <RowFixed>
                        <TYPE.main>
                          {inverted ? position?.amount0.toSignificant(4) : position?.amount1.toSignificant(4)}
                        </TYPE.main>
                        {typeof ratio === 'number' && !removed ? (
                          <DarkGreyCard padding="4px 6px" style={{ width: 'fit-content', marginLeft: '8px' }}>
                            <TYPE.main color={theme.text2} fontSize={11}>
                              {inverted ? ratio : 100 - ratio}%
                            </TYPE.main>
                          </DarkGreyCard>
                        ) : null}
                      </RowFixed>
                    </RowBetween>
                    <RowBetween>
                      <RowFixed>
                        <CurrencyLogo currency={currencyBase} size={'20px'} style={{ marginRight: '0.5rem' }} />
                        <TYPE.main>{currencyBase?.symbol}</TYPE.main>
                      </RowFixed>
                      <RowFixed>
                        <TYPE.main>
                          {inverted ? position?.amount1.toSignificant(4) : position?.amount0.toSignificant(4)}
                        </TYPE.main>
                        {typeof ratio === 'number' && !removed ? (
                          <DarkGreyCard padding="4px 6px" style={{ width: 'fit-content', marginLeft: '8px' }}>
                            <TYPE.main color={theme.text2} fontSize={11}>
                              {inverted ? 100 - ratio : ratio}%
                            </TYPE.main>
                          </DarkGreyCard>
                        ) : null}
                      </RowFixed>
                    </RowBetween>
                  </AutoColumn>
                </LightCard>
              </AutoColumn>
            </DarkCard>
            <DarkCard>
              <AutoColumn gap="md" style={{ width: '100%' }}>
                <AutoColumn gap="md">
                  <RowBetween style={{ alignItems: 'flex-start' }}>
                    <AutoColumn gap="md">
                      <Label>Unclaimed fees</Label>
                      {fiatValueOfFees?.greaterThan(new Fraction(1, 100)) ? (
                        <TYPE.largeHeader color={theme.green1} fontSize="36px" fontWeight={500}>
                          ${fiatValueOfFees.toFixed(2)}
                        </TYPE.largeHeader>
                      ) : (
                        <TYPE.largeHeader color={theme.text1} fontSize="36px" fontWeight={500}>
                          $-
                        </TYPE.largeHeader>
                      )}
                    </AutoColumn>
                    {ownsNFT && (feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0) || !!collectMigrationHash) ? (
                      <ButtonConfirmed
                        disabled={collecting || !!collectMigrationHash}
                        confirmed={!!collectMigrationHash && !isCollectPending}
                        width="fit-content"
                        style={{ borderRadius: '12px' }}
                        padding="4px 8px"
                        onClick={() => setShowConfirm(true)}
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
                        <TYPE.main>{currencyQuote?.symbol}</TYPE.main>
                      </RowFixed>
                      <RowFixed>
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
                    </RowBetween>
                    <RowBetween>
                      <RowFixed>
                        <CurrencyLogo currency={currencyBase} size={'20px'} style={{ marginRight: '0.5rem' }} />
                        <TYPE.main>{currencyBase?.symbol}</TYPE.main>
                      </RowFixed>
                      <RowFixed>
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
                    </RowBetween>
                  </AutoColumn>
                </LightCard>
              </AutoColumn>
            </DarkCard>
          </AutoColumn>
        </ResponsiveRow>
        <DarkCard>
          <AutoColumn gap="md">
            <RowBetween>
              <RowFixed>
                <Label display="flex" style={{ marginRight: '12px' }}>
                  Price range
                </Label>
                <HideExtraSmall>
                  <>
                    <RangeBadge removed={removed} inRange={inRange} />
                    <span style={{ width: '8px' }} />
                  </>
                </HideExtraSmall>
              </RowFixed>
              <RowFixed>
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
                <AutoColumn gap="8px" justify="center">
                  <ExtentsText>Min price</ExtentsText>
                  <TYPE.mediumHeader textAlign="center">{priceLower?.toSignificant(4)}</TYPE.mediumHeader>
                  <ExtentsText> {currencyQuote?.symbol + ' / ' + currencyBase?.symbol}</ExtentsText>

                  {inRange && (
                    <TYPE.small color={theme.text3}>
                      Your position will be 100% {currencyBase?.symbol} at this price.
                    </TYPE.small>
                  )}
                </AutoColumn>
              </LightCard>

              <DoubleArrow>⟷</DoubleArrow>
              <LightCard padding="12px" width="100%">
                <AutoColumn gap="8px" justify="center">
                  <ExtentsText>Max price</ExtentsText>
                  <TYPE.mediumHeader textAlign="center">{priceUpper?.toSignificant(4)}</TYPE.mediumHeader>
                  <ExtentsText> {currencyQuote?.symbol + ' / ' + currencyBase?.symbol}</ExtentsText>

                  {inRange && (
                    <TYPE.small color={theme.text3}>
                      Your position will be 100% {currencyQuote?.symbol} at this price.
                    </TYPE.small>
                  )}
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
