import { BigNumber } from '@ethersproject/bignumber'
import type { TransactionResponse } from '@ethersproject/providers'
import { InterfacePageName, LiquidityEventName } from '@uniswap/analytics-events'
// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import {
  Currency,
  CurrencyAmount,
  Fraction,
  NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
  Percent,
  Price,
  Token,
} from '@uniswap/sdk-core'
import { FeeAmount, NonfungiblePositionManager, Pool, Position, TICK_SPACINGS } from '@uniswap/v3-sdk'
import Badge from 'components/Badge/Badge'
import RangeBadge from 'components/Badge/RangeBadge'
import { ButtonConfirmed, ButtonGray, ButtonPrimary, SmallButtonPrimary } from 'components/Button/buttons'
import { DarkCard, LightCard } from 'components/Card/cards'
import { PositionNFT } from 'components/Liquidity/PositionNFT'
import { getLPBaseAnalyticsProperties } from 'components/Liquidity/analytics'
import { LoadingFullscreen } from 'components/Loader/styled'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { getPriceOrderingFromPositionForUI } from 'components/PositionListItem'
import RateToggle from 'components/RateToggle'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import { AutoColumn } from 'components/deprecated/Column'
import { RowBetween, RowFixed } from 'components/deprecated/Row'
import { Dots } from 'components/swap/styled'
import { getPoolDetailsURL, getTokenDetailsURL, isGqlSupportedChain } from 'graphql/data/util'
import { useToken } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import { useV3NFTPositionManagerContract } from 'hooks/useContract'
import { useEthersSigner } from 'hooks/useEthersSigner'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import { PoolState, usePool } from 'hooks/usePools'
import { usePositionTokenURI } from 'hooks/usePositionTokenURI'
import { useV3PositionFees } from 'hooks/useV3PositionFees'
import { useV3PositionFromTokenId } from 'hooks/useV3Positions'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import styled, { useTheme } from 'lib/styled-components'
import { LoadingRows } from 'pages/LegacyPool/styled'
import { PropsWithChildren, useCallback, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async/lib/index'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { Bound } from 'state/mint/v3/actions'
import { useIsTransactionPending, useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import { ClickableStyle, ExternalLink, HideExtraSmall, HideSmall, StyledRouterLink, ThemedText } from 'theme/components'
import { Switch, Text } from 'ui/src'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useIsSupportedChainId, useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useUSDCPrice } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { currencyId } from 'utils/currencyId'
import { WrongChainError } from 'utils/errors'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { unwrappedToken } from 'utils/unwrappedToken'
import { assume0xAddress } from 'utils/wagmi'
import { erc721Abi } from 'viem'
import { useReadContract } from 'wagmi'

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

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.lg}px`}) {
    min-width: 100%;
    padding: 16px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    min-width: 100%;
    padding: 16px;
  }
`

const BadgeText = styled.div`
  font-weight: 535;
  font-size: 14px;
  color: ${({ theme }) => theme.neutral2};
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
  color: ${({ theme }) => theme.neutral2};
  font-size: 14px;
  text-align: center;
  margin-right: 4px;
  font-weight: 535;
`

const HoverText = styled(ThemedText.DeprecatedMain)`
  text-decoration: none;
  color: ${({ theme }) => theme.neutral2};
  :hover {
    color: ${({ theme }) => theme.neutral1};
    text-decoration: none;
  }
`

const DoubleArrow = styled.span`
  color: ${({ theme }) => theme.neutral3};
  margin: 0 1rem;
`
const ResponsiveRow = styled(RowBetween)`
  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    flex-direction: column;
    align-items: flex-start;
    row-gap: 16px;
    width: 100%;
  }
`

const ActionButtonResponsiveRow = styled(ResponsiveRow)`
  width: 50%;
  justify-content: flex-end;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
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

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.lg}px`}) {
    width: fit-content;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    width: fit-content;
  }
`

const StyledPoolLink = styled(Link)`
  text-decoration: none;
  ${ClickableStyle}
`

const PairHeader = styled(ThemedText.H1Medium)`
  margin-right: 10px;
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
  const { formatPrice } = useFormatter()

  if (!pool || !currencyQuote || !currencyBase) {
    return null
  }

  return (
    <LightCard padding="12px">
      <AutoColumn gap="sm" justify="center">
        <ExtentsText>
          <Trans i18nKey="common.currentPrice" />
        </ExtentsText>
        <ThemedText.DeprecatedMediumHeader textAlign="center">
          {formatPrice({ price: inverted ? pool.token1Price : pool.token0Price, type: NumberType.TokenTx })}
        </ThemedText.DeprecatedMediumHeader>
        <ExtentsText>
          <Trans
            i18nKey="common.feesEarnedPerBase"
            values={{ symbolA: currencyQuote?.symbol, symbolB: currencyBase?.symbol }}
          />
        </ExtentsText>
      </AutoColumn>
    </LightCard>
  )
}

const TokenLink = ({
  children,
  chainId,
  address,
}: PropsWithChildren<{ chainId: UniverseChainId; address: string }>) => {
  const tokenLink = getTokenDetailsURL({ address, chain: toGraphQLChain(chainId) })
  return <StyledRouterLink to={tokenLink}>{children}</StyledRouterLink>
}

const ExternalTokenLink = ({ children, chainId, address }: PropsWithChildren<{ chainId: number; address: string }>) => {
  return <ExternalLink href={getExplorerLink(chainId, address, ExplorerDataType.TOKEN)}>{children}</ExternalLink>
}

function LinkedCurrency({ chainId, currency }: { chainId: number; currency?: Currency }) {
  const address = (currency as Token)?.address
  const supportedChain = useSupportedChainId(chainId)

  const Link = isGqlSupportedChain(supportedChain) ? TokenLink : ExternalTokenLink
  return (
    <Link chainId={chainId} address={address}>
      <RowFixed>
        <CurrencyLogo currency={currency} size={20} style={{ marginRight: '0.5rem' }} />
        <ThemedText.DeprecatedMain>{currency?.symbol} ↗</ThemedText.DeprecatedMain>
      </RowFixed>
    </Link>
  )
}

function getRatio(
  lower: Price<Currency, Currency>,
  current: Price<Currency, Currency>,
  upper: Price<Currency, Currency>,
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
          <Trans i18nKey="common.positionUnavailable">Position unavailable</Trans>
        </ThemedText.HeadlineLarge>
        <ThemedText.BodyPrimary style={{ marginBottom: '32px' }}>
          <Trans i18nKey="pool.position.networkConnect" />
        </ThemedText.BodyPrimary>
        <PositionPageButtonPrimary as={Link} to="/pool" width="fit-content">
          <Trans i18nKey="pool.back" />
        </PositionPageButtonPrimary>
      </div>
    </PageWrapper>
  )
}

export default function PositionPage() {
  const { chainId } = useAccount()
  const isSupportedChain = useIsSupportedChainId(chainId)
  if (isSupportedChain) {
    return <PositionPageContent />
  } else {
    return <PositionPageUnsupportedContent />
  }
}

const PositionLabelRow = styled(RowFixed)({
  flexWrap: 'wrap',
  gap: 8,
})

function parseTokenId(tokenId: string | undefined): BigNumber | undefined {
  if (!tokenId) {
    return undefined
  }
  try {
    return BigNumber.from(tokenId)
  } catch (error) {
    return undefined
  }
}

function PositionPageContent() {
  const { t } = useTranslation()
  const trace = useTrace()
  const { tokenId: tokenIdFromUrl } = useParams<{ tokenId?: string }>()
  const account = useAccount()
  const supportedChain = useSupportedChainId(account.chainId)
  const signer = useEthersSigner()
  const theme = useTheme()
  const { formatCurrencyAmount, formatDelta, formatTickPrice } = useFormatter()

  const { defaultChainId } = useEnabledChains()

  const parsedTokenId = parseTokenId(tokenIdFromUrl)
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
  const nativeCurrency = useNativeCurrency(supportedChain)
  const nativeWrappedSymbol = nativeCurrency.wrapped.symbol

  // get pool address from details returned
  const poolAddress = token0 && token1 && feeAmount ? Pool.getAddress(token0, token1, feeAmount) : undefined

  // construct Position from details returned
  const [poolState, pool] = usePool(token0 ?? undefined, token1 ?? undefined, feeAmount)
  const position = useMemo(() => {
    if (pool && liquidity && typeof tickLower === 'number' && typeof tickUpper === 'number') {
      return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper])

  const tickAtLimit = useIsTickAtLimit(TICK_SPACINGS[feeAmount as FeeAmount], tickLower, tickUpper)

  const pricesFromPosition = getPriceOrderingFromPositionForUI(position)
  const [manuallyInverted, setManuallyInverted] = useState(false)

  // handle manual inversion
  const { priceLower, priceUpper, base } = useInverter({
    priceLower: pricesFromPosition.priceLower as Price<Token, Token>,
    priceUpper: pricesFromPosition.priceUpper as Price<Token, Token>,
    quote: pricesFromPosition.quote as Token,
    base: pricesFromPosition.base as Token,
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
          inverted ? priceLower.invert() : priceUpper,
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
  const { price: price0 } = useUSDCPrice(token0 ?? undefined)
  const { price: price1 } = useUSDCPrice(token1 ?? undefined)

  const feeValue0Usd = useMemo(() => {
    if (!price0 || !feeValue0) {
      return null
    }
    // we wrap because it doesn't matter, the quote returns a USDC amount
    const feeValue0Wrapped = feeValue0.wrapped
    return price0.quote(feeValue0Wrapped)
  }, [price0, feeValue0])

  const feeValue1Usd = useMemo(() => {
    if (!price1 || !feeValue1) {
      return null
    }
    // we wrap because it doesn't matter, the quote returns a USDC amount
    const feeValue1Wrapped = feeValue1.wrapped
    return price1.quote(feeValue1Wrapped)
  }, [price1, feeValue1])

  const fiatValueOfTotalFees = feeValue0Usd && feeValue1Usd ? feeValue0Usd.add(feeValue1Usd) : null

  const fiatValueOfLiquidity: CurrencyAmount<Currency> | null = useMemo(() => {
    if (!price0 || !price1 || !position) {
      return null
    }
    const amount0 = price0.quote(position.amount0)
    const amount1 = price1.quote(position.amount1)
    return amount0.add(amount1)
  }, [price0, price1, position])

  const addTransaction = useTransactionAdder()
  const positionManager = useV3NFTPositionManagerContract()
  const collect = useCallback(async () => {
    if (
      !currency0ForFeeCollectionPurposes ||
      !currency1ForFeeCollectionPurposes ||
      account.status !== 'connected' ||
      !positionManager ||
      !tokenId ||
      !signer
    ) {
      return
    }

    setCollecting(true)

    // we fall back to expecting 0 fees in case the fetch fails, which is safe in the
    // vast majority of cases
    const { calldata, value } = NonfungiblePositionManager.collectCallParameters({
      tokenId: tokenId.toString(),
      expectedCurrencyOwed0: feeValue0 ?? CurrencyAmount.fromRawAmount(currency0ForFeeCollectionPurposes, 0),
      expectedCurrencyOwed1: feeValue1 ?? CurrencyAmount.fromRawAmount(currency1ForFeeCollectionPurposes, 0),
      recipient: account.address,
    })

    const txn = {
      to: positionManager.address,
      data: calldata,
      value,
    }

    const connectedChainId = await signer.getChainId()
    if (account.chainId !== connectedChainId) {
      throw new WrongChainError()
    }

    signer
      .estimateGas(txn)
      .then((estimate) => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(estimate),
        }

        return signer.sendTransaction(newTxn).then((response: TransactionResponse) => {
          setCollectMigrationHash(response.hash)
          setCollecting(false)

          sendAnalyticsEvent(LiquidityEventName.COLLECT_LIQUIDITY_SUBMITTED, {
            transaction_hash: response.hash,
            ...getLPBaseAnalyticsProperties({
              trace,
              fee: feeAmount,
              currency0: currency0ForFeeCollectionPurposes,
              currency1: currency1ForFeeCollectionPurposes,
              version: ProtocolVersion.V3,
              poolId: poolAddress,
              currency0AmountUsd: feeValue0Usd,
              currency1AmountUsd: feeValue1Usd,
            }),
          })

          addTransaction(response, {
            type: TransactionType.COLLECT_FEES,
            token0CurrencyId: currencyId(currency0ForFeeCollectionPurposes),
            token1CurrencyId: currencyId(currency1ForFeeCollectionPurposes),
            token0CurrencyAmountRaw:
              feeValue0?.quotient.toString() ??
              CurrencyAmount.fromRawAmount(currency0ForFeeCollectionPurposes, 0).toExact(),
            token1CurrencyAmountRaw:
              feeValue1?.quotient.toString() ??
              CurrencyAmount.fromRawAmount(currency1ForFeeCollectionPurposes, 0).toExact(),
          })
        })
      })
      .catch((error) => {
        setCollecting(false)
        logger.error(error, {
          tags: {
            file: 'PositionPage',
            function: 'collectCallback',
          },
        })
      })
  }, [
    currency0ForFeeCollectionPurposes,
    currency1ForFeeCollectionPurposes,
    account.status,
    account.address,
    account.chainId,
    positionManager,
    tokenId,
    signer,
    feeValue0,
    feeValue1,
    trace,
    feeAmount,
    poolAddress,
    feeValue0Usd,
    feeValue1Usd,
    addTransaction,
  ])

  const { data: owner } = useReadContract({
    address: assume0xAddress(NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[account.chainId ?? UniverseChainId.Mainnet]),
    abi: erc721Abi,
    functionName: 'ownerOf',
    args: tokenId ? [tokenId.toBigInt()] : undefined,
    query: { enabled: !!tokenId },
  })

  const ownsNFT = owner === account.address || positionDetails?.operator === account.address

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
                <CurrencyLogo currency={feeValueUpper?.currency} size={20} style={{ marginRight: '0.5rem' }} />
                <ThemedText.DeprecatedMain>
                  {feeValueUpper ? formatCurrencyAmount({ amount: feeValueUpper }) : '-'}
                </ThemedText.DeprecatedMain>
              </RowFixed>
              <ThemedText.DeprecatedMain>{feeValueUpper?.currency?.symbol}</ThemedText.DeprecatedMain>
            </RowBetween>
            <RowBetween>
              <RowFixed>
                <CurrencyLogo currency={feeValueLower?.currency} size={20} style={{ marginRight: '0.5rem' }} />
                <ThemedText.DeprecatedMain>
                  {feeValueLower ? formatCurrencyAmount({ amount: feeValueLower }) : '-'}
                </ThemedText.DeprecatedMain>
              </RowFixed>
              <ThemedText.DeprecatedMain>{feeValueLower?.currency?.symbol}</ThemedText.DeprecatedMain>
            </RowBetween>
          </AutoColumn>
        </LightCard>
        <Text fontSize={12} fontStyle="italic" color="$neutral2">
          <Trans i18nKey="pool.collectingFeesWithdraw" />
        </Text>
        <ButtonPrimary data-testid="modal-collect-fees-button" onClick={collect}>
          <Trans i18nKey="common.collect.button" />
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
      !collectMigrationHash,
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
    <Trace logImpression page={InterfacePageName.POOL_PAGE}>
      <>
        <Helmet>
          <title>
            {t(`liquidityPool.positions.page.title`, {
              quoteSymbol: currencyQuote?.symbol,
              baseSymbol: currencyBase?.symbol,
            })}
          </title>
        </Helmet>
        <PageWrapper>
          <TransactionConfirmationModal
            isOpen={showConfirm}
            onDismiss={() => setShowConfirm(false)}
            attemptingTxn={collecting}
            hash={collectMigrationHash ?? ''}
            reviewContent={() => (
              <ConfirmationModalContent
                title={<Trans i18nKey="pool.collectFees" />}
                onDismiss={() => setShowConfirm(false)}
                topContent={modalHeader}
              />
            )}
            pendingText={<Trans i18nKey="common.collecting.fees" />}
          />
          <AutoColumn gap="md">
            <AutoColumn gap="sm">
              <Link
                data-cy="visit-pool"
                style={{ textDecoration: 'none', width: 'fit-content', marginBottom: '0.5rem' }}
                to="/pool"
              >
                <HoverText>
                  ← <Trans i18nKey="pool.back" />
                </HoverText>
              </Link>
              <ResponsiveRow>
                <PositionLabelRow>
                  <DoubleCurrencyLogo currencies={[currencyBase, currencyQuote]} size={24} />
                  <StyledPoolLink
                    to={
                      poolAddress
                        ? getPoolDetailsURL(poolAddress, toGraphQLChain(supportedChain ?? defaultChainId))
                        : ''
                    }
                  >
                    <PairHeader>
                      &nbsp;{currencyQuote?.symbol}&nbsp;/&nbsp;{currencyBase?.symbol}
                    </PairHeader>
                  </StyledPoolLink>
                  <Badge style={{ marginRight: '8px' }}>
                    <BadgeText>{formatDelta(parseFloat(new Percent(feeAmount, 1_000_000).toSignificant()))}</BadgeText>
                  </Badge>
                  <RangeBadge removed={removed} inRange={inRange} />
                </PositionLabelRow>
                {ownsNFT && (
                  <ActionButtonResponsiveRow>
                    {currency0 && currency1 && feeAmount && tokenId ? (
                      <ButtonGray
                        as={Link}
                        to={`/add/${currencyId(currency0)}/${currencyId(currency1)}/${feeAmount}/${tokenId}`}
                        padding="6px 8px"
                        width="fit-content"
                        $borderRadius="12px"
                        style={{ marginRight: '8px' }}
                      >
                        <Trans i18nKey="pool.increaseLiquidity" />
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
                        <Trans i18nKey="pool.removeLiquidity" />
                      </SmallButtonPrimary>
                    ) : null}
                  </ActionButtonResponsiveRow>
                )}
              </ResponsiveRow>
            </AutoColumn>
            <ResponsiveRow align="flex-start">
              <HideSmall
                style={{
                  height: '100%',
                  marginRight: 12,
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
                    <PositionNFT image={metadata.result.image} height={400} />
                    {typeof account.chainId === 'number' && owner && !ownsNFT ? (
                      <ExternalLink href={getExplorerLink(account.chainId, owner, ExplorerDataType.ADDRESS)}>
                        <Trans i18nKey="pool.owner" />
                      </ExternalLink>
                    ) : null}
                  </DarkCard>
                ) : (
                  <DarkCard
                    width="100%"
                    height="100%"
                    style={{
                      minWidth: '340px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <LoadingFullscreen />
                  </DarkCard>
                )}
              </HideSmall>
              <AutoColumn gap="sm" style={{ width: '100%', height: '100%' }}>
                <DarkCard>
                  <AutoColumn gap="md" style={{ width: '100%' }}>
                    <AutoColumn gap="md">
                      <Label>
                        <Trans i18nKey="common.liquidity" />
                      </Label>
                      {fiatValueOfLiquidity?.greaterThan(new Fraction(1, 100)) ? (
                        <ThemedText.DeprecatedLargeHeader fontSize="36px" fontWeight={535}>
                          {formatCurrencyAmount({
                            amount: fiatValueOfLiquidity,
                            type: NumberType.FiatTokenPrice,
                          })}
                        </ThemedText.DeprecatedLargeHeader>
                      ) : (
                        <ThemedText.DeprecatedLargeHeader color={theme.neutral1} fontSize="36px" fontWeight={535}>
                          -
                        </ThemedText.DeprecatedLargeHeader>
                      )}
                    </AutoColumn>
                    <LightCard padding="12px 16px">
                      <AutoColumn gap="md">
                        <RowBetween>
                          <LinkedCurrency
                            chainId={account.chainId ?? UniverseChainId.Mainnet}
                            currency={currencyQuote}
                          />
                          <RowFixed>
                            <ThemedText.DeprecatedMain>
                              {formatCurrencyAmount({ amount: inverted ? position?.amount0 : position?.amount1 })}
                            </ThemedText.DeprecatedMain>
                            {typeof ratio === 'number' && !removed ? (
                              <Badge style={{ marginLeft: '10px' }}>
                                <BadgeText>{inverted ? ratio : 100 - ratio}%</BadgeText>
                              </Badge>
                            ) : null}
                          </RowFixed>
                        </RowBetween>
                        <RowBetween>
                          <LinkedCurrency
                            chainId={account.chainId ?? UniverseChainId.Mainnet}
                            currency={currencyBase}
                          />
                          <RowFixed>
                            <ThemedText.DeprecatedMain>
                              {formatCurrencyAmount({ amount: inverted ? position?.amount1 : position?.amount0 })}
                            </ThemedText.DeprecatedMain>
                            {typeof ratio === 'number' && !removed ? (
                              <Badge style={{ marginLeft: '10px' }}>
                                <BadgeText>{inverted ? 100 - ratio : ratio}%</BadgeText>
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
                            <Trans i18nKey="pool.uncollectedFees" />
                          </Label>
                          {fiatValueOfTotalFees?.greaterThan(new Fraction(1, 100)) ? (
                            <ThemedText.DeprecatedLargeHeader color={theme.success} fontSize="36px" fontWeight={535}>
                              {formatCurrencyAmount({ amount: fiatValueOfTotalFees, type: NumberType.FiatTokenPrice })}
                            </ThemedText.DeprecatedLargeHeader>
                          ) : (
                            <ThemedText.DeprecatedLargeHeader color={theme.neutral1} fontSize="36px" fontWeight={535}>
                              -
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
                              <ThemedText.DeprecatedMain color={theme.neutral1}>
                                <Trans i18nKey="pool.collected" />
                              </ThemedText.DeprecatedMain>
                            ) : isCollectPending || collecting ? (
                              <ThemedText.DeprecatedMain color={theme.neutral1}>
                                {' '}
                                <Dots>
                                  <Trans i18nKey="pool.collecting" />
                                </Dots>
                              </ThemedText.DeprecatedMain>
                            ) : (
                              <>
                                <ThemedText.DeprecatedMain color={theme.white}>
                                  <Trans i18nKey="pool.collectFees" />
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
                              size={20}
                              style={{ marginRight: '0.5rem' }}
                            />
                            <ThemedText.DeprecatedMain>{feeValueUpper?.currency?.symbol}</ThemedText.DeprecatedMain>
                          </RowFixed>
                          <RowFixed>
                            <ThemedText.DeprecatedMain>
                              {feeValueUpper ? formatCurrencyAmount({ amount: feeValueUpper }) : '-'}
                            </ThemedText.DeprecatedMain>
                          </RowFixed>
                        </RowBetween>
                        <RowBetween>
                          <RowFixed>
                            <CurrencyLogo
                              currency={feeValueLower?.currency}
                              size={20}
                              style={{ marginRight: '0.5rem' }}
                            />
                            <ThemedText.DeprecatedMain>{feeValueLower?.currency?.symbol}</ThemedText.DeprecatedMain>
                          </RowFixed>
                          <RowFixed>
                            <ThemedText.DeprecatedMain>
                              {feeValueLower ? formatCurrencyAmount({ amount: feeValueLower }) : '-'}
                            </ThemedText.DeprecatedMain>
                          </RowFixed>
                        </RowBetween>
                      </AutoColumn>
                    </LightCard>
                    {showCollectAsWeth && (
                      <AutoColumn gap="md">
                        <RowBetween>
                          <ThemedText.DeprecatedMain>
                            <Trans i18nKey="pool.collectAs" values={{ nativeWrappedSymbol }} />
                          </ThemedText.DeprecatedMain>
                          <Switch
                            id="receive-as-weth"
                            checked={receiveWETH}
                            onCheckedChange={() => setReceiveWETH((receiveWETH) => !receiveWETH)}
                            variant="branded"
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
                      <Trans i18nKey="pool.priceRange" />
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
                        <Trans i18nKey="pool.minPrice" />
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
                        <Trans
                          i18nKey="common.feesEarnedPerBase"
                          values={{ symbolA: currencyQuote?.symbol, symbolB: currencyBase?.symbol }}
                        />
                      </ExtentsText>

                      {inRange && (
                        <Text fontSize={11} color="$neutral3">
                          <Trans i18nKey="pool.position.100" />
                        </Text>
                      )}
                    </AutoColumn>
                  </LightCard>

                  <DoubleArrow>⟷</DoubleArrow>
                  <LightCard padding="12px" width="100%">
                    <AutoColumn gap="sm" justify="center">
                      <ExtentsText>
                        <Trans i18nKey="pool.maxPrice" />
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
                        <Trans
                          i18nKey="common.feesEarnedPerBase"
                          values={{ symbolA: currencyQuote?.symbol, symbolB: currencyBase?.symbol }}
                        />
                      </ExtentsText>

                      {inRange && (
                        <Text fontSize={11} color="$neutral3">
                          <Trans i18nKey="pool.position.100.at" values={{ symbol: currencyQuote?.symbol }} />
                        </Text>
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
