import { BigNumber } from '@ethersproject/bignumber'
import type { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { Trace } from '@uniswap/analytics'
import { InterfacePageName } from '@uniswap/analytics-events'
import { formatPrice, NumberType } from '@uniswap/conedison/format'
import { ChainId, Currency, CurrencyAmount, Fraction, Percent, Price, Token } from '@thinkincoin-libs/sdk-core'
import { NonfungiblePositionManager, Pool, Position } from '@thinkincoin-libs/uniswap-v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { sendEvent } from 'components/analytics'
import Badge from 'components/Badge'
import { ButtonConfirmed, ButtonGray, ButtonPrimary } from 'components/Button'
import { DarkCard, LightCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Loader from 'components/Icons/LoadingSpinner'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { RowBetween, RowFixed } from 'components/Row'
import { Dots } from 'components/swap/styleds'
import Toggle from 'components/Toggle'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import { CHAIN_IDS_TO_NAMES, isSupportedChain } from 'constants/chains'
import { isGqlSupportedChain } from 'graphql/data/util'
import { useToken } from 'hooks/Tokens'
import { useV3NFTPositionManagerContract } from 'hooks/useContract'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import { PoolState, usePool } from 'hooks/usePools'
import useStablecoinPrice from 'hooks/useStablecoinPrice'
import { useV3PositionFees } from 'hooks/useV3PositionFees'
import { useV3PositionFromTokenId } from 'hooks/useV3Positions'
import { useSingleCallResult } from 'lib/hooks/multicall'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Bound } from 'state/mint/v3/actions'
import { useIsTransactionPending, useTransactionAdder } from 'state/transactions/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { ExternalLink, HideExtraSmall, HideSmall, ThemedText } from 'theme'
import { currencyId } from 'utils/currencyId'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { formatTickPrice } from 'utils/formatTickPrice'
import { unwrappedToken } from 'utils/unwrappedToken'

import RangeBadge from '../../components/Badge/RangeBadge'
import { SmallButtonPrimary } from '../../components/Button/index'
import { getPriceOrderingFromPositionForUI } from '../../components/PositionListItem'
import RateToggle from '../../components/RateToggle'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import { usePositionTokenURI } from '../../hooks/usePositionTokenURI'
import { TransactionType } from '../../state/transactions/types'
import { calculateGasMargin } from '../../utils/calculateGasMargin'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { LoadingRows } from './styleds'

const getTokenLink = (chainId: ChainId, address: string) => {
  if (isGqlSupportedChain(chainId)) {
    const chainName = CHAIN_IDS_TO_NAMES[chainId]
    return `${window.location.origin}/#/tokens/${chainName}/${address}`
  } else {
    return getExplorerLink(chainId, address, ExplorerDataType.TOKEN)
  }
}

const PositionPageButtonPrimary = styled(ButtonPrimary)`
  width: 228px;
  height: 40px;
  font-size: 16px;
  line-height: 20px;
  border-radius: 12px;
`

const PageWrapper = styled.div`
  padding: 68px 16px 16px 16px;

  min-width: 800px;
  max-width: 960px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    min-width: 100%;
    padding: 16px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    min-width: 100%;
    padding: 16px;
  }
`

const BadgeText = styled.div`
  font-weight: 500;
  font-size: 14px;
`

// responsive text
// disable the warning because we don't use the end prop, we just want to filter it out
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Label = styled(({ end, ...props }) => <ThemedText.DeprecatedLabel {...props} />)<{ end?: boolean }>`
  display: flex;
  font-size: 16px;
  justify-content: ${({ end }) => (end ? 'flex-end' : 'flex-start')};
  align-items: center;
`

const ExtentsText = styled.span`
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  text-align: center;
  margin-right: 4px;
  font-weight: 500;
`

const HoverText = styled(ThemedText.DeprecatedMain)`
  text-decoration: none;
  color: ${({ theme }) => theme.textTertiary};
  :hover {
    color: ${({ theme }) => theme.textPrimary};
    text-decoration: none;
  }
`

const DoubleArrow = styled.span`
  color: ${({ theme }) => theme.textTertiary};
  margin: 0 1rem;
`
const ResponsiveRow = styled(RowBetween)`
  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    flex-direction: column;
    align-items: flex-start;
    row-gap: 16px;
    width: 100%;
  }
`

const ActionButtonResponsiveRow = styled(ResponsiveRow)`
  width: 50%;
  justify-content: flex-end;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    width: 100%;
    flex-direction: row;
    * {
      width: 100%;
    }
  }
`

const ResponsiveButtonConfirmed = styled(ButtonConfirmed)`
  border-radius: 12px;
  padding: 6px 8px;
  width: fit-content;
  font-size: 16px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    width: fit-content;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    width: fit-content;
  }
`

const NFTGrid = styled.div`
  display: grid;
  grid-template: 'overlap';
  min-height: 400px;
`

const NFTCanvas = styled.canvas`
  grid-area: overlap;
`

const NFTImage = styled.img`
  grid-area: overlap;
  height: 400px;
  /* Ensures SVG appears on top of canvas. */
  z-index: 1;
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
    <LightCard padding="12px">
      <AutoColumn gap="sm" justify="center">
        <ExtentsText>
          <Trans>Current price</Trans>
        </ExtentsText>
        <ThemedText.DeprecatedMediumHeader textAlign="center">
          {formatPrice(inverted ? pool.token1Price : pool.token0Price, NumberType.TokenTx)}
        </ThemedText.DeprecatedMediumHeader>
        <ExtentsText>
          <Trans>
            {currencyQuote?.symbol} per {currencyBase?.symbol}
          </Trans>
        </ExtentsText>
      </AutoColumn>
    </LightCard>
  )
}

function LinkedCurrency({ chainId, currency }: { chainId?: number; currency?: Currency }) {
  const address = (currency as Token)?.address

  if (typeof chainId === 'number' && address) {
    return (
      <ExternalLink href={getTokenLink(chainId, address)}>
        <RowFixed>
          <CurrencyLogo currency={currency} size="20px" style={{ marginRight: '0.5rem' }} />
          <ThemedText.DeprecatedMain>{currency?.symbol} ↗</ThemedText.DeprecatedMain>
        </RowFixed>
      </ExternalLink>
    )
  }

  return (
    <RowFixed>
      <CurrencyLogo currency={currency} size="20px" style={{ marginRight: '0.5rem' }} />
      <ThemedText.DeprecatedMain>{currency?.symbol}</ThemedText.DeprecatedMain>
    </RowFixed>
  )
}

function getRatio(
  lower: Price<Currency, Currency>,
  current: Price<Currency, Currency>,
  upper: Price<Currency, Currency>
) {
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

// snapshots a src img into a canvas
function getSnapshot(src: HTMLImageElement, canvas: HTMLCanvasElement, targetHeight: number) {
  const context = canvas.getContext('2d')

  if (context) {
    let { width, height } = src

    // src may be hidden and not have the target dimensions
    const ratio = width / height
    height = targetHeight
    width = Math.round(ratio * targetHeight)

    // Ensure crispness at high DPIs
    canvas.width = width * devicePixelRatio
    canvas.height = height * devicePixelRatio
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    context.scale(devicePixelRatio, devicePixelRatio)

    context.clearRect(0, 0, width, height)
    context.drawImage(src, 0, 0, width, height)
  }
}

function NFT({ image, height: targetHeight }: { image: string; height: number }) {
  const [animate, setAnimate] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  return (
    <NFTGrid
      onMouseEnter={() => {
        setAnimate(true)
      }}
      onMouseLeave={() => {
        // snapshot the current frame so the transition to the canvas is smooth
        if (imageRef.current && canvasRef.current) {
          getSnapshot(imageRef.current, canvasRef.current, targetHeight)
        }
        setAnimate(false)
      }}
    >
      <NFTCanvas ref={canvasRef} />
      <NFTImage
        ref={imageRef}
        src={image}
        hidden={!animate}
        onLoad={() => {
          // snapshot for the canvas
          if (imageRef.current && canvasRef.current) {
            getSnapshot(imageRef.current, canvasRef.current, targetHeight)
          }
        }}
      />
    </NFTGrid>
  )
}

const useInverter = ({
  priceLower,
  priceUpper,
  quote,
  base,
  invert,
}: {
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  quote?: Token
  base?: Token
  invert?: boolean
}): {
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  quote?: Token
  base?: Token
} => {
  return {
    priceUpper: invert ? priceLower?.invert() : priceUpper,
    priceLower: invert ? priceUpper?.invert() : priceLower,
    quote: invert ? base : quote,
    base: invert ? quote : base,
  }
}

export function PositionPageUnsupportedContent() {
  return (
    <PageWrapper>
      <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <ThemedText.HeadlineLarge style={{ marginBottom: '8px' }}>
          <Trans>Position unavailable</Trans>
        </ThemedText.HeadlineLarge>
        <ThemedText.BodyPrimary style={{ marginBottom: '32px' }}>
          <Trans>To view a position, you must be connected to the network it belongs to.</Trans>
        </ThemedText.BodyPrimary>
        <PositionPageButtonPrimary as={Link} to="/pools" width="fit-content">
          <Trans>Back to Pools</Trans>
        </PositionPageButtonPrimary>
      </div>
    </PageWrapper>
  )
}

export default function PositionPage() {
  const { chainId } = useWeb3React()
  if (isSupportedChain(chainId)) {
    return <PositionPageContent />
  } else {
    return <PositionPageUnsupportedContent />
  }
}

function PositionPageContent() {
  const { tokenId: tokenIdFromUrl } = useParams<{ tokenId?: string }>()
  const { chainId, account, provider } = useWeb3React()
  const theme = useTheme()

  const parsedTokenId = tokenIdFromUrl ? BigNumber.from(tokenIdFromUrl) : undefined
  const { loading, position: positionDetails } = useV3PositionFromTokenId(parsedTokenId)

  const {
    token0: token0Address,
    token1: token1Address,
    fee: feeAmount,
    liquidity,
    tickLower,
    tickUpper,
    tokenId,
  } = positionDetails || {}

  const removed = liquidity?.eq(0)

  const metadata = usePositionTokenURI(parsedTokenId)

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  // flag for receiving WETH
  const [receiveWETH, setReceiveWETH] = useState(false)
  const nativeCurrency = useNativeCurrency(chainId)
  const nativeWrappedSymbol = nativeCurrency.wrapped.symbol

  // construct Position from details returned
  const [poolState, pool] = usePool(token0 ?? undefined, token1 ?? undefined, feeAmount)
  const position = useMemo(() => {
    if (pool && liquidity && typeof tickLower === 'number' && typeof tickUpper === 'number') {
      return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper])

  const tickAtLimit = useIsTickAtLimit(feeAmount, tickLower, tickUpper)

  const pricesFromPosition = getPriceOrderingFromPositionForUI(position)
  const [manuallyInverted, setManuallyInverted] = useState(false)

  // handle manual inversion
  const { priceLower, priceUpper, base } = useInverter({
    priceLower: pricesFromPosition.priceLower,
    priceUpper: pricesFromPosition.priceUpper,
    quote: pricesFromPosition.quote,
    base: pricesFromPosition.base,
    invert: manuallyInverted,
  })

  const inverted = token1 ? base?.equals(token1) : undefined
  const currencyQuote = inverted ? currency0 : currency1
  const currencyBase = inverted ? currency1 : currency0

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
  const [feeValue0, feeValue1] = useV3PositionFees(pool ?? undefined, positionDetails?.tokenId, receiveWETH)

  // these currencies will match the feeValue{0,1} currencies for the purposes of fee collection
  const currency0ForFeeCollectionPurposes = pool ? (receiveWETH ? pool.token0 : unwrappedToken(pool.token0)) : undefined
  const currency1ForFeeCollectionPurposes = pool ? (receiveWETH ? pool.token1 : unwrappedToken(pool.token1)) : undefined

  const [collecting, setCollecting] = useState<boolean>(false)
  const [collectMigrationHash, setCollectMigrationHash] = useState<string | null>(null)
  const isCollectPending = useIsTransactionPending(collectMigrationHash ?? undefined)
  const [showConfirm, setShowConfirm] = useState(false)

  // usdc prices always in terms of tokens
  const price0 = useStablecoinPrice(token0 ?? undefined)
  const price1 = useStablecoinPrice(token1 ?? undefined)

  const fiatValueOfFees: CurrencyAmount<Currency> | null = useMemo(() => {
    if (!price0 || !price1 || !feeValue0 || !feeValue1) return null

    // we wrap because it doesn't matter, the quote returns a USDC amount
    const feeValue0Wrapped = feeValue0?.wrapped
    const feeValue1Wrapped = feeValue1?.wrapped

    if (!feeValue0Wrapped || !feeValue1Wrapped) return null

    const amount0 = price0.quote(feeValue0Wrapped)
    const amount1 = price1.quote(feeValue1Wrapped)
    return amount0.add(amount1)
  }, [price0, price1, feeValue0, feeValue1])

  const fiatValueOfLiquidity: CurrencyAmount<Token> | null = useMemo(() => {
    if (!price0 || !price1 || !position) return null
    const amount0 = price0.quote(position.amount0)
    const amount1 = price1.quote(position.amount1)
    return amount0.add(amount1)
  }, [price0, price1, position])

  const addTransaction = useTransactionAdder()
  const positionManager = useV3NFTPositionManagerContract()
  const collect = useCallback(() => {
    if (
      !currency0ForFeeCollectionPurposes ||
      !currency1ForFeeCollectionPurposes ||
      !chainId ||
      !positionManager ||
      !account ||
      !tokenId ||
      !provider
    )
      return

    setCollecting(true)

    // we fall back to expecting 0 fees in case the fetch fails, which is safe in the
    // vast majority of cases
    const { calldata, value } = NonfungiblePositionManager.collectCallParameters({
      tokenId: tokenId.toString(),
      expectedCurrencyOwed0: feeValue0 ?? CurrencyAmount.fromRawAmount(currency0ForFeeCollectionPurposes, 0),
      expectedCurrencyOwed1: feeValue1 ?? CurrencyAmount.fromRawAmount(currency1ForFeeCollectionPurposes, 0),
      recipient: account,
    })

    const txn = {
      to: positionManager.address,
      data: calldata,
      value,
    }

    provider
      .getSigner()
      .estimateGas(txn)
      .then((estimate) => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(estimate),
        }

        return provider
          .getSigner()
          .sendTransaction(newTxn)
          .then((response: TransactionResponse) => {
            setCollectMigrationHash(response.hash)
            setCollecting(false)

            sendEvent({
              category: 'Liquidity',
              action: 'CollectV3',
              label: [currency0ForFeeCollectionPurposes.symbol, currency1ForFeeCollectionPurposes.symbol].join('/'),
            })

            addTransaction(response, {
              type: TransactionType.COLLECT_FEES,
              currencyId0: currencyId(currency0ForFeeCollectionPurposes),
              currencyId1: currencyId(currency1ForFeeCollectionPurposes),
              expectedCurrencyOwed0:
                feeValue0?.quotient.toString() ??
                CurrencyAmount.fromRawAmount(currency0ForFeeCollectionPurposes, 0).toExact(),
              expectedCurrencyOwed1:
                feeValue1?.quotient.toString() ??
                CurrencyAmount.fromRawAmount(currency1ForFeeCollectionPurposes, 0).toExact(),
            })
          })
      })
      .catch((error) => {
        setCollecting(false)
        console.error(error)
      })
  }, [
    chainId,
    feeValue0,
    feeValue1,
    currency0ForFeeCollectionPurposes,
    currency1ForFeeCollectionPurposes,
    positionManager,
    account,
    tokenId,
    addTransaction,
    provider,
  ])

  const owner = useSingleCallResult(tokenId ? positionManager : null, 'ownerOf', [tokenId]).result?.[0]
  const ownsNFT = owner === account || positionDetails?.operator === account

  const feeValueUpper = inverted ? feeValue0 : feeValue1
  const feeValueLower = inverted ? feeValue1 : feeValue0

  // check if price is within range
  const below = pool && typeof tickLower === 'number' ? pool.tickCurrent < tickLower : undefined
  const above = pool && typeof tickUpper === 'number' ? pool.tickCurrent >= tickUpper : undefined
  const inRange: boolean = typeof below === 'boolean' && typeof above === 'boolean' ? !below && !above : false

  function modalHeader() {
    return (
      <AutoColumn gap="md" style={{ marginTop: '20px' }}>
        <LightCard padding="12px 16px">
          <AutoColumn gap="md">
            <RowBetween>
              <RowFixed>
                <CurrencyLogo currency={feeValueUpper?.currency} size="20px" style={{ marginRight: '0.5rem' }} />
                <ThemedText.DeprecatedMain>
                  {feeValueUpper ? formatCurrencyAmount(feeValueUpper, 4) : '-'}
                </ThemedText.DeprecatedMain>
              </RowFixed>
              <ThemedText.DeprecatedMain>{feeValueUpper?.currency?.symbol}</ThemedText.DeprecatedMain>
            </RowBetween>
            <RowBetween>
              <RowFixed>
                <CurrencyLogo currency={feeValueLower?.currency} size="20px" style={{ marginRight: '0.5rem' }} />
                <ThemedText.DeprecatedMain>
                  {feeValueLower ? formatCurrencyAmount(feeValueLower, 4) : '-'}
                </ThemedText.DeprecatedMain>
              </RowFixed>
              <ThemedText.DeprecatedMain>{feeValueLower?.currency?.symbol}</ThemedText.DeprecatedMain>
            </RowBetween>
          </AutoColumn>
        </LightCard>
        <ThemedText.DeprecatedItalic>
          <Trans>Collecting fees will withdraw currently available fees for you.</Trans>
        </ThemedText.DeprecatedItalic>
        <ButtonPrimary data-testid="modal-collect-fees-button" onClick={collect}>
          <Trans>Collect</Trans>
        </ButtonPrimary>
      </AutoColumn>
    )
  }

  const showCollectAsWeth = Boolean(
    ownsNFT &&
      (feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0)) &&
      currency0 &&
      currency1 &&
      (currency0.isNative || currency1.isNative) &&
      !collectMigrationHash
  )

  if (!positionDetails && !loading) {
    return <PositionPageUnsupportedContent />
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
    <Trace page={InterfacePageName.POOL_PAGE} shouldLogImpression>
      <>
        <PageWrapper>
          <TransactionConfirmationModal
            isOpen={showConfirm}
            onDismiss={() => setShowConfirm(false)}
            attemptingTxn={collecting}
            hash={collectMigrationHash ?? ''}
            reviewContent={() => (
              <ConfirmationModalContent
                title={<Trans>Claim fees</Trans>}
                onDismiss={() => setShowConfirm(false)}
                topContent={modalHeader}
              />
            )}
            pendingText={<Trans>Collecting fees</Trans>}
          />
          <AutoColumn gap="md">
            <AutoColumn gap="sm">
              <Link
                data-cy="visit-pool"
                style={{ textDecoration: 'none', width: 'fit-content', marginBottom: '0.5rem' }}
                to="/pools"
              >
                <HoverText>
                  <Trans>← Back to Pools</Trans>
                </HoverText>
              </Link>
              <ResponsiveRow>
                <RowFixed>
                  <DoubleCurrencyLogo currency0={currencyBase} currency1={currencyQuote} size={24} margin={true} />
                  <ThemedText.DeprecatedLabel fontSize="24px" mr="10px">
                    &nbsp;{currencyQuote?.symbol}&nbsp;/&nbsp;{currencyBase?.symbol}
                  </ThemedText.DeprecatedLabel>
                  <Badge style={{ marginRight: '8px' }}>
                    <BadgeText>
                      <Trans>{new Percent(feeAmount, 1_000_000).toSignificant()}%</Trans>
                    </BadgeText>
                  </Badge>
                  <RangeBadge removed={removed} inRange={inRange} />
                </RowFixed>
                {ownsNFT && (
                  <ActionButtonResponsiveRow>
                    {currency0 && currency1 && feeAmount && tokenId ? (
                      <ButtonGray
                        as={Link}
                        to={`/increase/${currencyId(currency0)}/${currencyId(currency1)}/${feeAmount}/${tokenId}`}
                        padding="6px 8px"
                        width="fit-content"
                        $borderRadius="12px"
                        style={{ marginRight: '8px' }}
                      >
                        <Trans>Increase Liquidity</Trans>
                      </ButtonGray>
                    ) : null}
                    {tokenId && !removed ? (
                      <SmallButtonPrimary
                        as={Link}
                        to={`/remove/${tokenId}`}
                        padding="6px 8px"
                        width="fit-content"
                        $borderRadius="12px"
                      >
                        <Trans>Remove Liquidity</Trans>
                      </SmallButtonPrimary>
                    ) : null}
                  </ActionButtonResponsiveRow>
                )}
              </ResponsiveRow>
              <RowBetween></RowBetween>
            </AutoColumn>
            <ResponsiveRow align="flex-start">
              <HideSmall
                style={{
                  marginRight: '12px',
                }}
              >
                {'result' in metadata ? (
                  <DarkCard
                    width="100%"
                    height="100%"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flexDirection: 'column',
                      justifyContent: 'space-around',
                      minWidth: '340px',
                    }}
                  >
                    <NFT image={metadata.result.image} height={400} />
                    {typeof chainId === 'number' && owner && !ownsNFT ? (
                      <ExternalLink href={getExplorerLink(chainId, owner, ExplorerDataType.ADDRESS)}>
                        <Trans>Owner</Trans>
                      </ExternalLink>
                    ) : null}
                  </DarkCard>
                ) : (
                  <DarkCard
                    width="100%"
                    height="100%"
                    style={{
                      minWidth: '340px',
                    }}
                  >
                    <Loader />
                  </DarkCard>
                )}
              </HideSmall>
              <AutoColumn gap="sm" style={{ width: '100%', height: '100%' }}>
                <DarkCard>
                  <AutoColumn gap="md" style={{ width: '100%' }}>
                    <AutoColumn gap="md">
                      <Label>
                        <Trans>Liquidity</Trans>
                      </Label>
                      {fiatValueOfLiquidity?.greaterThan(new Fraction(1, 100)) ? (
                        <ThemedText.DeprecatedLargeHeader fontSize="36px" fontWeight={500}>
                          <Trans>${fiatValueOfLiquidity.toFixed(2, { groupSeparator: ',' })}</Trans>
                        </ThemedText.DeprecatedLargeHeader>
                      ) : (
                        <ThemedText.DeprecatedLargeHeader color={theme.textPrimary} fontSize="36px" fontWeight={500}>
                          <Trans>$-</Trans>
                        </ThemedText.DeprecatedLargeHeader>
                      )}
                    </AutoColumn>
                    <LightCard padding="12px 16px">
                      <AutoColumn gap="md">
                        <RowBetween>
                          <LinkedCurrency chainId={chainId} currency={currencyQuote} />
                          <RowFixed>
                            <ThemedText.DeprecatedMain>
                              {inverted ? position?.amount0.toSignificant(4) : position?.amount1.toSignificant(4)}
                            </ThemedText.DeprecatedMain>
                            {typeof ratio === 'number' && !removed ? (
                              <Badge style={{ marginLeft: '10px' }}>
                                <ThemedText.DeprecatedMain color={theme.textSecondary} fontSize={11}>
                                  <Trans>{inverted ? ratio : 100 - ratio}%</Trans>
                                </ThemedText.DeprecatedMain>
                              </Badge>
                            ) : null}
                          </RowFixed>
                        </RowBetween>
                        <RowBetween>
                          <LinkedCurrency chainId={chainId} currency={currencyBase} />
                          <RowFixed>
                            <ThemedText.DeprecatedMain>
                              {inverted ? position?.amount1.toSignificant(4) : position?.amount0.toSignificant(4)}
                            </ThemedText.DeprecatedMain>
                            {typeof ratio === 'number' && !removed ? (
                              <Badge style={{ marginLeft: '10px' }}>
                                <ThemedText.DeprecatedMain color={theme.textSecondary} fontSize={11}>
                                  <Trans>{inverted ? 100 - ratio : ratio}%</Trans>
                                </ThemedText.DeprecatedMain>
                              </Badge>
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
                          <Label>
                            <Trans>Unclaimed fees</Trans>
                          </Label>
                          {fiatValueOfFees?.greaterThan(new Fraction(1, 100)) ? (
                            <ThemedText.DeprecatedLargeHeader
                              color={theme.accentSuccess}
                              fontSize="36px"
                              fontWeight={500}
                            >
                              <Trans>${fiatValueOfFees.toFixed(2, { groupSeparator: ',' })}</Trans>
                            </ThemedText.DeprecatedLargeHeader>
                          ) : (
                            <ThemedText.DeprecatedLargeHeader
                              color={theme.textPrimary}
                              fontSize="36px"
                              fontWeight={500}
                            >
                              <Trans>$-</Trans>
                            </ThemedText.DeprecatedLargeHeader>
                          )}
                        </AutoColumn>
                        {ownsNFT &&
                        (feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0) || !!collectMigrationHash) ? (
                          <ResponsiveButtonConfirmed
                            data-testid="collect-fees-button"
                            disabled={collecting || !!collectMigrationHash}
                            confirmed={!!collectMigrationHash && !isCollectPending}
                            width="fit-content"
                            style={{ borderRadius: '12px' }}
                            padding="4px 8px"
                            onClick={() => setShowConfirm(true)}
                          >
                            {!!collectMigrationHash && !isCollectPending ? (
                              <ThemedText.DeprecatedMain color={theme.textPrimary}>
                                <Trans> Collected</Trans>
                              </ThemedText.DeprecatedMain>
                            ) : isCollectPending || collecting ? (
                              <ThemedText.DeprecatedMain color={theme.textPrimary}>
                                {' '}
                                <Dots>
                                  <Trans>Collecting</Trans>
                                </Dots>
                              </ThemedText.DeprecatedMain>
                            ) : (
                              <>
                                <ThemedText.DeprecatedMain color={theme.white}>
                                  <Trans>Collect fees</Trans>
                                </ThemedText.DeprecatedMain>
                              </>
                            )}
                          </ResponsiveButtonConfirmed>
                        ) : null}
                      </RowBetween>
                    </AutoColumn>
                    <LightCard padding="12px 16px">
                      <AutoColumn gap="md">
                        <RowBetween>
                          <RowFixed>
                            <CurrencyLogo
                              currency={feeValueUpper?.currency}
                              size="20px"
                              style={{ marginRight: '0.5rem' }}
                            />
                            <ThemedText.DeprecatedMain>{feeValueUpper?.currency?.symbol}</ThemedText.DeprecatedMain>
                          </RowFixed>
                          <RowFixed>
                            <ThemedText.DeprecatedMain>
                              {feeValueUpper ? formatCurrencyAmount(feeValueUpper, 4) : '-'}
                            </ThemedText.DeprecatedMain>
                          </RowFixed>
                        </RowBetween>
                        <RowBetween>
                          <RowFixed>
                            <CurrencyLogo
                              currency={feeValueLower?.currency}
                              size="20px"
                              style={{ marginRight: '0.5rem' }}
                            />
                            <ThemedText.DeprecatedMain>{feeValueLower?.currency?.symbol}</ThemedText.DeprecatedMain>
                          </RowFixed>
                          <RowFixed>
                            <ThemedText.DeprecatedMain>
                              {feeValueLower ? formatCurrencyAmount(feeValueLower, 4) : '-'}
                            </ThemedText.DeprecatedMain>
                          </RowFixed>
                        </RowBetween>
                      </AutoColumn>
                    </LightCard>
                    {showCollectAsWeth && (
                      <AutoColumn gap="md">
                        <RowBetween>
                          <ThemedText.DeprecatedMain>
                            <Trans>Collect as {nativeWrappedSymbol}</Trans>
                          </ThemedText.DeprecatedMain>
                          <Toggle
                            id="receive-as-weth"
                            isActive={receiveWETH}
                            toggle={() => setReceiveWETH((receiveWETH) => !receiveWETH)}
                          />
                        </RowBetween>
                      </AutoColumn>
                    )}
                  </AutoColumn>
                </DarkCard>
              </AutoColumn>
            </ResponsiveRow>
            <DarkCard>
              <AutoColumn gap="md">
                <RowBetween>
                  <RowFixed>
                    <Label display="flex" style={{ marginRight: '12px' }}>
                      <Trans>Price range</Trans>
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
                    <AutoColumn gap="sm" justify="center">
                      <ExtentsText>
                        <Trans>Min price</Trans>
                      </ExtentsText>
                      <ThemedText.DeprecatedMediumHeader textAlign="center">
                        {formatTickPrice({
                          price: priceLower,
                          atLimit: tickAtLimit,
                          direction: Bound.LOWER,
                          numberType: NumberType.TokenTx,
                        })}
                      </ThemedText.DeprecatedMediumHeader>
                      <ExtentsText>
                        {' '}
                        <Trans>
                          {currencyQuote?.symbol} per {currencyBase?.symbol}
                        </Trans>
                      </ExtentsText>

                      {inRange && (
                        <ThemedText.DeprecatedSmall color={theme.textTertiary}>
                          <Trans>Your position will be 100% {currencyBase?.symbol} at this price.</Trans>
                        </ThemedText.DeprecatedSmall>
                      )}
                    </AutoColumn>
                  </LightCard>

                  <DoubleArrow>⟷</DoubleArrow>
                  <LightCard padding="12px" width="100%">
                    <AutoColumn gap="sm" justify="center">
                      <ExtentsText>
                        <Trans>Max price</Trans>
                      </ExtentsText>
                      <ThemedText.DeprecatedMediumHeader textAlign="center">
                        {formatTickPrice({
                          price: priceUpper,
                          atLimit: tickAtLimit,
                          direction: Bound.UPPER,
                          numberType: NumberType.TokenTx,
                        })}
                      </ThemedText.DeprecatedMediumHeader>
                      <ExtentsText>
                        {' '}
                        <Trans>
                          {currencyQuote?.symbol} per {currencyBase?.symbol}
                        </Trans>
                      </ExtentsText>

                      {inRange && (
                        <ThemedText.DeprecatedSmall color={theme.textTertiary}>
                          <Trans>Your position will be 100% {currencyQuote?.symbol} at this price.</Trans>
                        </ThemedText.DeprecatedSmall>
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
        <SwitchLocaleLink />
      </>
    </Trace>
  )
}
