/* oxlint-disable max-lines */
import { areEvmAddressesEqual } from '@universe/chains'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Gas } from 'ui/src/components/icons/Gas'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import type { MarginQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { MarginDirection, type MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { MARGIN_CHAIN_ID, type MarginMarket } from '~/constants/margin'
import { useAccount } from '~/hooks/useAccount'
import { buildOpenPlanRequest } from '~/pages/Swap/Margin/components/MarginOpenButton'
import { MarginPriceImpactRow } from '~/pages/Swap/Margin/components/MarginPriceImpactRow'
import { MarginVenueLogo } from '~/pages/Swap/Margin/components/MarginVenueLogo'
import { MarginActionModalShell } from '~/pages/Swap/Margin/components/shared/MarginActionModalShell'
import { MarginDetailRow } from '~/pages/Swap/Margin/components/shared/MarginDetailRow'
import { MarginPairHeading } from '~/pages/Swap/Margin/components/shared/MarginPairHeading'
import { MarginShowMoreToggle } from '~/pages/Swap/Margin/components/shared/MarginShowMoreToggle'
import type { DerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { useExecuteMarginPlan } from '~/pages/Swap/Margin/hooks/useExecuteMarginPlan'
import { useIsPlanInFlight } from '~/pages/Swap/Margin/hooks/useIsPlanInFlight'
import { getMarginCurrencyInfo, useMarginCurrencyInfos } from '~/pages/Swap/Margin/hooks/useMarginCurrencyInfos'
import { useMarginMarkets } from '~/pages/Swap/Margin/hooks/useMarginMarkets'
import { useMarginMarketsStaleTick } from '~/pages/Swap/Margin/hooks/useMarginMarketsStaleTick'
import { marginAssetCurrencyId, marginTokenCurrencyId } from '~/pages/Swap/Margin/marginCurrencies'
import {
  exposureUsdValue,
  formatLiqDistanceSuffix,
  getMarginHealthStatus,
  marginPriceUnitSymbol,
  marginVenueLabel,
  projectedDebtAmount,
  quoteLiqDistanceSignedPct,
  scaledE18ToNumber,
  usablePriceX18,
  usableWireAmount,
} from '~/pages/Swap/Margin/marginFormat'
import { marginPriceImpactBps } from '~/pages/Swap/Margin/marginPriceImpact'
import { resolveReviewVenuePin } from '~/pages/Swap/Margin/marginReviewVenuePin'
import {
  displayMarkPriceX18,
  type MarginResolvedMark,
  resolvePinnedMarkPriceX18,
  resolveVenueMarket,
} from '~/pages/Swap/Margin/marginRoutedMarket'
import { marginUnwrapSymbol } from '~/pages/Swap/Margin/marginTokenDisplay'

function AmountSection({
  label,
  value,
  usd,
  logoUrl,
  symbol,
  trailing,
}: {
  label: string
  value: string
  usd?: string
  logoUrl?: string
  symbol: string
  trailing?: ReactNode
}): JSX.Element {
  return (
    <Flex row justifyContent="space-between" alignItems="center" gap="$spacing12">
      <Flex gap="$spacing2" flexShrink={1}>
        <Text variant="body3" color="$neutral2">
          {label}
        </Text>
        <Text variant="heading2" color="$neutral1">
          {value}
        </Text>
        <Flex row alignItems="center" gap="$spacing6">
          {usd ? (
            <Text variant="body3" color="$neutral2">
              {usd}
            </Text>
          ) : null}
          {trailing}
        </Flex>
      </Flex>
      <TokenLogo size={36} url={logoUrl} symbol={symbol} chainId={MARGIN_CHAIN_ID} hideNetworkLogo />
    </Flex>
  )
}

// notionalUsd is computed here, not a wire field: the quote publishes no mark for a non-close action,
// so the caller resolves the routed venue's oracle mark from the registry and passes it in.
function MarginReviewAmounts({
  derivedMarginInfo,
  pinnedMarket,
  markPriceX18,
  quote,
}: {
  derivedMarginInfo: DerivedMarginInfo
  // Same rule as MarginReviewDetails: the PINNED quote's market, never `derivedMarginInfo.market`.
  // Only pair-level facts are read off it today, but every venue-scoped figure in this block resolves
  // from the pin, and having the form's market in scope here is how that stops being true.
  pinnedMarket: MarginMarket
  // The pinned VENUE's oracle mark, resolved by the caller; undefined on a registry miss.
  markPriceX18: string | undefined
  quote: MarginQuoteResponse
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const currencyInfos = useMarginCurrencyInfos()
  const { direction, leverage, paymentCurrency, paymentCurrencyInfo, paymentCurrencyAmount, paymentUsdValue } =
    derivedMarginInfo
  const market = pinnedMarket

  const collateralLogoUrl = getMarginCurrencyInfo({ currencyInfos, currencyId: marginAssetCurrencyId(market) })?.logoUrl
  const debtLogoUrl = getMarginCurrencyInfo({ currencyInfos, currencyId: marginTokenCurrencyId(market.debt) })?.logoUrl

  // The routed venue's ORACLE mark while the poll is FRESH: valuing at the fill would read ~10% high
  // on a fill 10% adverse to the oracle, beside an impact row reporting that very 10%. Inside the stale
  // window the two deliberately part company — this figure falls back to the fill because it HAS a
  // fallback and must not price off an aged mark, while the impact row takes the unbounded mark and
  // discloses the delay. That disagreement is the price of a bound only one of them can honour; the
  // alternatives are valuing the size at an aged mark, or no impact disclosure at all.
  const usableMark = displayMarkPriceX18({ markPriceX18, quote })
  const markPrice = usableMark ? scaledE18ToNumber(usableMark) : undefined
  // display.size is denominated in the exposure leg — a short's is its debt leg, a long's its
  // collateral — so it is decoded off the QUOTE's own declared exposure decimals. Reading the form
  // market's would render at the wrong scale for a quote whose pair drifted from the form's.
  const exposureSymbol = direction === MarginDirection.SHORT ? marginUnwrapSymbol(market.debt) : market.displaySymbol
  const exposureLogoUrl = direction === MarginDirection.SHORT ? debtLogoUrl : collateralLogoUrl
  const notional =
    quote.display.size !== undefined
      ? usableWireAmount({ raw: quote.display.size, decimals: quote.exposureToken.decimals })
      : undefined
  const notionalUsd =
    notional !== undefined && markPrice !== undefined
      ? exposureUsdValue({ exposureAmount: notional, mark: markPrice })
      : undefined
  // Recovered from the projection (the quote publishes no debt figure), in debt-token units.
  const borrowing = projectedDebtAmount({ quote })

  const paymentSymbol = paymentCurrency.symbol ?? ''
  const fiat = (value?: number): string | undefined =>
    value !== undefined ? formatNumberOrString({ value, type: NumberType.FiatStandard }) : undefined
  const tokenAmount = (value: number, symbol: string): string =>
    `${formatNumberOrString({ value, type: NumberType.TokenTx })} ${symbol}`

  // Leverage multiplies the EXPOSURE. A long's exposure is its total size, so the chip belongs there.
  // A short's exposure is the leg it borrows — its collateral total is margin plus sale proceeds, one
  // turn larger — so on a short the chip sits on Borrowing or it contradicts the number beside it.
  // Off the PINNED quote, like every other figure here. `derivedMarginInfo.leverage` is the live form
  // store, which MarginSizeBlock's clamp effect can still lower behind the open sheet (a markets
  // refetch dropping maxLeverage) — the chip would move while the quote Confirm sends does not.
  const pinnedLeverage = quote.display.leverage === undefined ? leverage : Number(quote.display.leverage)
  const leverageChip = (
    <Text variant="body3" color="$statusSuccess">
      {t('margin.review.leverageInline', { leverage: pinnedLeverage.toFixed(2) })}
    </Text>
  )

  return (
    <>
      <AmountSection
        label={t('margin.review.margin')}
        value={tokenAmount(Number(paymentCurrencyAmount?.toExact() ?? 0), paymentSymbol)}
        usd={paymentUsdValue ? fiat(Number(paymentUsdValue.toExact())) : undefined}
        logoUrl={paymentCurrencyInfo.logoUrl ?? undefined}
        symbol={paymentSymbol}
      />
      <AmountSection
        label={t('margin.size.borrowing')}
        value={borrowing === undefined ? '—' : tokenAmount(borrowing, marginUnwrapSymbol(market.debt))}
        logoUrl={debtLogoUrl ?? undefined}
        symbol={marginUnwrapSymbol(market.debt)}
        trailing={direction === MarginDirection.SHORT ? leverageChip : undefined}
      />
      <AmountSection
        label={t('margin.review.totalSize')}
        value={notional !== undefined ? tokenAmount(notional, exposureSymbol) : '—'}
        usd={fiat(notionalUsd)}
        logoUrl={exposureLogoUrl ?? undefined}
        symbol={exposureSymbol}
        trailing={direction === MarginDirection.SHORT ? undefined : leverageChip}
      />
    </>
  )
}

function MarginReviewDetails({
  derivedMarginInfo,
  pinnedMarket,
  markPriceX18,
  impactMark,
  quote,
}: {
  derivedMarginInfo: DerivedMarginInfo
  // The PINNED quote's market, never `derivedMarginInfo.market` (the form's pair-first one) — on a
  // re-route those name different venues. Only pair-level facts are read off it (symbols, decimals),
  // which are venue-independent, so the caller's fallback is safe here.
  pinnedMarket: MarginMarket
  // The pinned VENUE's oracle mark, resolved by the caller and undefined when the registry has no
  // exact entry for it OR the markets poll has aged out. Passed in rather than looked up here so the
  // "never price a fill against another venue's mark" rule has one owner in this file.
  markPriceX18: string | undefined
  // The same mark WITHOUT the freshness bound, for the impact row only, carrying its own `isStale` so
  // the row SAYS the price is delayed rather than quietly measuring against it — see its use below.
  impactMark: MarginResolvedMark
  quote: MarginQuoteResponse
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const { direction } = derivedMarginInfo

  // The impact otherwise only renders inside the form's fee list, which is collapsed by default —
  // so the default path to Confirm never showed it. The row hides itself below the warning threshold,
  // so a healthy fill is unaffected. Takes the UNBOUNDED mark, unlike the risk figures below: impact
  // IS mark-vs-fill and cannot fall back to the fill, so withholding an aged mark hides the row on the
  // confirm screen while `canConfirm` carries no freshness term — see the `allowStale` docstring.
  const priceImpactBps = marginPriceImpactBps({
    execPriceX18: quote.display.effectivePrice,
    markPriceX18: impactMark.priceX18,
    swapSide: 'BUY_COLLATERAL',
    direction: direction ?? MarginDirection.LONG,
  })

  const health = quote.display.healthFactor
    ? getMarginHealthStatus(scaledE18ToNumber(quote.display.healthFactor))
    : undefined
  const liqColor = health?.color ?? '$neutral1'
  const liqPriceDisplay = quote.display.liquidationPrice
    ? formatNumberOrString({
        value: scaledE18ToNumber(quote.display.liquidationPrice),
        type: NumberType.FiatTokenPrice,
      })
    : undefined
  const liqUnitSymbol = marginPriceUnitSymbol({
    collateral: pinnedMarket.collateral,
    debt: pinnedMarket.debt,
    direction,
  })
  // The ORACLE mark, not the quote's fill price: liquidation triggers off the oracle, and an open's
  // fill is adverse to it — anchoring on the fill would overstate the buffer by roughly the impact,
  // worst exactly when the impact row beside it is firing. Also what the positions table measures
  // against, so the figure does not jump the moment the position opens.
  const liqDistancePct = quoteLiqDistanceSignedPct({
    liquidationPriceX18: quote.display.liquidationPrice,
    markPriceX18,
  })

  // Through usablePriceX18, not a bare `!== undefined`: the wire sends '0' where it means "could not
  // price", and rendering that as $0.00 would suppress the real ETH figure one branch down.
  const gasFeeUsd = usablePriceX18(quote.gasEstimate?.gasFeeUsd)
  const gasUsd = gasFeeUsd !== undefined ? scaledE18ToNumber(gasFeeUsd) : undefined
  // Through the same guarded decode as the size figures: a bare BigInt() here throws a SyntaxError on
  // a non-integer wire value and unwinds to the app ErrorBoundary, where '—' was the intended fallback.
  const gasFeeEth =
    quote.gasEstimate === undefined ? undefined : usableWireAmount({ raw: quote.gasEstimate.gasFeeWei, decimals: 18 })
  const gasDisplay =
    gasUsd !== undefined
      ? formatNumberOrString({ value: gasUsd, type: NumberType.FiatGasPrice })
      : gasFeeEth !== undefined
        ? `${gasFeeEth.toFixed(5)} ETH`
        : '—'

  return (
    <Flex gap="$spacing12">
      {/* The PRICE comes off the quote and needs no mark; only the distance suffix does. Gating the row
          on the distance hid where the position liquidates whenever the venue published no usable
          mark — on the last screen before a leveraged open, with Confirm still armed. */}
      {liqPriceDisplay ? (
        <MarginDetailRow
          label={t('margin.size.liquidatesAt')}
          value={
            <Text variant="body3" color="$neutral1">
              1 {liqUnitSymbol} = {liqPriceDisplay}{' '}
              {liqDistancePct === undefined ? null : (
                <Text variant="body3" color={liqColor}>
                  {formatLiqDistanceSuffix(liqDistancePct)}
                </Text>
              )}
            </Text>
          }
        />
      ) : null}
      <MarginPriceImpactRow impactBps={priceImpactBps} markIsStale={impactMark.isStale} />
      <MarginDetailRow
        label={t('margin.fees.networkCost')}
        value={
          <Flex row alignItems="center" gap="$spacing4">
            <Gas size="$icon.16" color="$neutral2" />
            <Text variant="body3" color="$neutral1">
              {gasDisplay}
            </Text>
          </Flex>
        }
      />
    </Flex>
  )
}

// The sheet pins the venue it opens on in mount-scoped state, so it must not outlive the open — an
// always-mounted body would pin at form mount rather than at review time. Every other margin action
// modal is mounted the same way.
export function MarginOpenReviewModal({
  derivedMarginInfo,
  isOpen,
  onClose,
}: {
  derivedMarginInfo: DerivedMarginInfo
  isOpen: boolean
  onClose: () => void
}): JSX.Element | null {
  return isOpen ? <MarginOpenReviewSheet derivedMarginInfo={derivedMarginInfo} onClose={onClose} /> : null
}

// Whether the footer must say why Confirm is shut. Covers a quote error, a pinned quote carrying no
// venue, and a venue the registry has no market for: none can hold the pin, so Confirm greys with no
// adopt bar above it, and re-opening re-pins the same quote — a dead end the user cannot diagnose.
//
// The bar is DURABILITY, not merely "a canConfirm term that can fail": the other two terms that can
// shut Confirm on their own — the account check and a missing live quote — both resolve themselves
// once the next poll lands (the quote query re-keys on the account), and labelling that window a
// failed quote would be wrong copy for a state that is about to clear.
export function shutConfirmReason({
  pinnedQuote,
  quoteError,
  pinnedVenue,
  pinnedMarketExact,
}: {
  pinnedQuote: MarginQuoteResponse | undefined
  quoteError: unknown
  pinnedVenue: MarginVenue | undefined
  // The EXACT registry entry, never the `?? market` fallback — that one is always defined, which
  // would make this branch permanently false and silently disable the message it exists for.
  pinnedMarketExact: MarginMarket | undefined
}): 'quoteFailed' | 'venueUnavailable' | undefined {
  if (!pinnedQuote) {
    return undefined
  }
  if (quoteError) {
    return 'quoteFailed'
  }
  // Distinct copy, not the quote-failure string. The quote arrived fine; what is missing is a registry
  // entry for the venue it routed to, so the pin cannot be verified and Confirm stays shut. Telling the
  // user to "try again" would be worse than unhelpful — a re-quote re-routes to the same venue and
  // re-opening re-pins it, so the advice describes a loop rather than a way out.
  return !pinnedVenue || !pinnedMarketExact ? 'venueUnavailable' : undefined
}

// The quote keeps polling while open and values update in place — fund-safe: confirm sends the echo the
// server re-derives against, and drift beyond slippage 400s. What in-place updating cannot cover is a
// change of COUNTERPARTY, so the venue is pinned (see below). Confirm mints the plan; the execution
// modal opens itself.
function MarginOpenReviewSheet({
  derivedMarginInfo,
  onClose,
}: {
  derivedMarginInfo: DerivedMarginInfo
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const account = useAccount()
  const { executePlan } = useExecuteMarginPlan()
  const isPlanInFlight = useIsPlanInFlight()
  const { getMarketByTokens, getLive, dataUpdatedAt } = useMarginMarkets()
  // Details start expanded — this is the final confirmation before spending; the toggle collapses them.
  const [isExpanded, setIsExpanded] = useState(true)
  const toggleExpanded = useEvent(() => setIsExpanded((prev) => !prev))

  const { market, direction, quote, quoteError, allowedVenues, excludedCount } = derivedMarginInfo

  // Pinned at mount = at open. While the venue holds it tracks every poll, so the figures stay live;
  // the moment a poll re-routes it stops advancing and becomes the held copy the user is looking at.
  // Re-pinned during render rather than in an effect so no frame ever draws a quote that is not the
  // one Confirm would send. Termination rests on React Query's structural sharing: `quote` keeps its
  // identity until a fetch actually changes the data.
  const [pinnedQuote, setPinnedQuote] = useState<MarginQuoteResponse | undefined>(quote)
  const pin = resolveReviewVenuePin({
    pinnedVenue: pinnedQuote?.legs[0]?.venue,
    quotedVenue: quote?.legs[0]?.venue,
  })
  // Guard on `quote`: the pin must never advance THROUGH undefined. A transient quote-gap (the wallet
  // disconnecting under an open sheet, then reconnecting) would otherwise drop the pinned venue and
  // silently adopt the next quote's route — the live-quote term in canConfirm holds Confirm instead.
  if (!pin.held && quote && quote !== pinnedQuote) {
    setPinnedQuote(quote)
  }
  const adoptRoute = useEvent(() => setPinnedQuote(quote))

  // The heading names the venue the QUOTE routed to, not the form's pair-first market — the pin is
  // worth nothing if the sheet never showed what it pinned. Same pair either way, so every other
  // figure (decimals, symbols) is unaffected.
  const pinnedVenue = pinnedQuote?.legs[0]?.venue
  const pinnedMarketExact = resolveVenueMarket({ market, venue: pinnedVenue, getMarketByTokens })
  // Display only — pair-level facts (symbols, decimals) are venue-independent, so falling back to the
  // form's market keeps the sheet readable on a registry miss. Anything VENUE-specific must key off
  // `pinnedMarketExact`: Confirm gates on it, the footer explains it, and the mark below resolves from
  // it. Substituting the form's venue there would compare this quote's fill against another venue's
  // mark, which is the whole reason the exact lookup exists.
  const pinnedMarket = pinnedMarketExact ?? market
  // The freshness bound compares against Date.now(), which only advances a render — and the poll
  // going quiet is exactly when a mark ages out. Keeps the disclosure honest while this is on screen.
  useMarginMarketsStaleTick()

  const pinnedMarkPriceX18 = resolvePinnedMarkPriceX18({
    pinnedMarketExact,
    getLive,
    marketsUpdatedAt: dataUpdatedAt,
  }).priceX18
  // The impact row's mark and the flag that discloses its age arrive together — see MarginResolvedMark.
  const impactMark = resolvePinnedMarkPriceX18({
    pinnedMarketExact,
    getLive,
    marketsUpdatedAt: dataUpdatedAt,
    allowStale: true,
  })

  const onConfirm = useEvent(() => {
    // The identity term is re-derived HERE rather than inherited from the CTA's disabled state, so the
    // guarantee is structural: a later edit to `canConfirm` cannot silently drop it. It does NOT close a
    // render race — `account` is read at render time, so this handler is only as fresh as `canConfirm`
    // was, and a real wallet switch re-renders and disables the button anyway. The adjust flow re-checks
    // at submit for the same reason.
    if (!account.address || !pinnedQuote || !areEvmAddressesEqual(pinnedQuote.swapper, account.address)) {
      return
    }
    // The PINNED quote, never the live one: what the user reviewed is what gets created.
    const request = buildOpenPlanRequest({ derivedMarginInfo, swapper: account.address, quote: pinnedQuote })
    if (request) {
      // The open is the one create that names an allowlist; the executor reports it alongside the
      // venue the server actually routed to.
      void executePlan({ request, venuePreference: { allowlistSent: allowedVenues, excludedCount } })
      onClose()
    }
  })

  const title = direction === MarginDirection.SHORT ? t('margin.review.titleShort') : t('margin.review.titleLong')
  const ctaLabel = direction === MarginDirection.SHORT ? t('margin.cta.openShort') : t('margin.cta.openLong')
  // The venue check ADDS to the existing gates (a quote at all, no quote error, no plan in flight);
  // none of them are relaxed by it.
  //
  // The account term is not redundant with the CTA that opened this sheet: the sheet outlives an
  // account switch, and the quote query bridges the previous account's data as placeholder while the
  // new key resolves — so without this, Confirm would post the new account's swapper against a quote
  // the old one was priced for. A pinned quote with no venue is likewise unsubmittable: the pin can
  // never hold against an absent venue, so every re-route would be adopted silently.
  const isQuoteForAccount =
    pinnedQuote?.swapper !== undefined &&
    account.address !== undefined &&
    areEvmAddressesEqual(pinnedQuote.swapper, account.address)
  // ONE list, two readers. The DURABLE terms — the ones that cannot clear themselves — live in
  // `shutConfirmReason`, which returns the copy key; `canConfirm` gates on that being absent, and adds
  // only the TRANSIENT terms, which resolve on the next poll and so must not put a permanent-sounding
  // message on screen. Related by convention, this file greyed Confirm with an empty footer twice (an
  // absent venue, then a registry miss); a new durable term added to one now shows up in the other.
  const shutReason = shutConfirmReason({ pinnedQuote, quoteError, pinnedVenue, pinnedMarketExact })
  const canConfirm =
    shutReason === undefined &&
    Boolean(pinnedQuote) &&
    Boolean(quote) &&
    isQuoteForAccount &&
    !isPlanInFlight &&
    !pin.held

  return (
    <MarginActionModalShell
      modalName={ModalName.MarginOpenReview}
      title={title}
      isOpen
      onClose={onClose}
      // This modal's body gap differs from the other two; normalizing it would be an unrequested
      // visual change.
      bodyGap="$spacing20"
      ctaLabel={ctaLabel}
      ctaDisabled={!canConfirm}
      footerMessage={
        <>
          {pin.adoptVenue ? (
            <TouchableArea testID={TestID.MarginReviewRouteChanged} onPress={adoptRoute}>
              <Flex
                row
                alignItems="center"
                justifyContent="center"
                gap="$spacing6"
                p="$spacing12"
                borderRadius="$rounded12"
                backgroundColor="$surface2"
              >
                <MarginVenueLogo venue={pin.adoptVenue} />
                <Text variant="body3" color="$accent1" textAlign="center">
                  {t('margin.review.routeChanged', { venue: marginVenueLabel(pin.adoptVenue) })}
                </Text>
              </Flex>
            </TouchableArea>
          ) : null}
          {isPlanInFlight ? (
            <Text variant="body4" color="$statusWarning" textAlign="center">
              {t('margin.error.planInFlight')}
            </Text>
          ) : null}
          {shutReason ? (
            <Text variant="body4" color="$statusCritical" textAlign="center">
              {shutReason === 'quoteFailed' ? t('margin.error.quoteFailed') : t('margin.error.venueUnavailable')}
            </Text>
          ) : null}
        </>
      }
      onConfirm={onConfirm}
    >
      <MarginPairHeading market={pinnedMarket} variant="venue" />
      {pinnedQuote ? (
        <>
          <MarginReviewAmounts
            derivedMarginInfo={derivedMarginInfo}
            pinnedMarket={pinnedMarket}
            markPriceX18={pinnedMarkPriceX18}
            quote={pinnedQuote}
          />
          <MarginShowMoreToggle isExpanded={isExpanded} onToggle={toggleExpanded} />
          {isExpanded ? (
            <MarginReviewDetails
              derivedMarginInfo={derivedMarginInfo}
              pinnedMarket={pinnedMarket}
              markPriceX18={pinnedMarkPriceX18}
              impactMark={impactMark}
              quote={pinnedQuote}
            />
          ) : null}
        </>
      ) : (
        <Text variant="body3" color="$statusCritical">
          {t('margin.error.quoteFailed')}
        </Text>
      )}
    </MarginActionModalShell>
  )
}
