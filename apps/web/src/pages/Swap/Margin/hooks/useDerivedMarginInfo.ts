import type { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import {
  MARGIN_NATIVE_TOKEN_ADDRESS,
  type MarginQuoteRequest,
  type MarginQuoteResponse,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import {
  isSameMarginQuoteSubject,
  marginQuoteParamsFromKey,
  useMarginQuoteQuery,
} from 'uniswap/src/data/apiClients/tradingApi/useMarginQuoteQuery'
import type { CurrencyInfo, PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { usePortfolioBalances } from 'uniswap/src/features/portfolio/balances/hooks'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { marginPairKey } from 'uniswap/src/features/transactions/margin/marginPairKey'
import { buildMarginOpenQuoteRequest } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/buildMarginQuoteRequest'
import { useMarginFormStore } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import type {
  MarginDirection,
  MarginPaymentToken,
  MarginSide,
  MarginVenue,
} from 'uniswap/src/features/transactions/margin/types'
import { currencyId, normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'
import { useDebounceWithStatus } from 'utilities/src/time/timing'
import {
  MARGIN_CHAIN_ID,
  MARGIN_DEBOUNCE_MS,
  MARGIN_PAYMENT_SOURCE_CHAIN_IDS,
  MARGIN_QUOTE_REFETCH_MS,
  type MarginMarket,
} from '~/constants/margin'
import { useAccount } from '~/hooks/useAccount'
import { useMarginVenueAllowlist } from '~/pages/Swap/Margin/hooks/useMarginVenueAllowlist'
import { useMarginVenueRoutedAnalytics } from '~/pages/Swap/Margin/hooks/useMarginVenueRoutedAnalytics'
import {
  getMarketDefaultPaymentToken,
  getPaymentCurrency,
  getSpendablePaymentBalance,
  isPaymentTokenDifferentFromCollateral,
} from '~/pages/Swap/Margin/marginCurrencies'
import { getMarginLeverageCap } from '~/pages/Swap/Margin/marginOpenButtonGate'
import { marginMarketDirection } from '~/pages/Swap/Margin/marginTokenDisplay'

// The allowlist reaching the builder is already derived, so it has nothing left to subtract.
const NO_EXCLUSIONS: MarginVenue[] = []

export interface DerivedMarginInfo {
  market: MarginMarket
  side: MarginSide
  // Ground truth for every pre-trade direction signal (CTA label, size preview, liq unit symbol):
  // the selected market's direction, falling back to the quote's own, falling back to a derivation
  // off the market's token addresses. NEVER the raw side toggle — it can diverge from the actual
  // selection.
  direction?: MarginDirection
  // Resolved payment token: store value, or the market default (collateral / native ETH).
  paymentToken: MarginPaymentToken
  paymentCurrency: Currency
  paymentCurrencyInfo: CurrencyInfo
  // Parsed from the live (non-debounced) input, for display + validation.
  paymentCurrencyAmount?: CurrencyAmount<Currency>
  paymentUsdValue?: CurrencyAmount<Currency> | null
  balance?: CurrencyAmount<Currency>
  isBalanceLoading: boolean
  leverage: number
  // Debounced raw payment-token units, drives the quote.
  paymentAmountRaw?: string
  isPaymentDifferentFromCollateral: boolean
  slippageToleranceBps: number
  quote?: MarginQuoteResponse
  isQuoteLoading: boolean
  // RQ-v5: true while a placeholder-bridged quote (see below) is refetching. isLoading alone misses this
  // window, so a CTA gated only on isQuoteLoading can fire against a stale echo.
  isFetching: boolean
  isPlaceholderData: boolean
  isDebouncing: boolean
  quoteError: unknown
  // Slider ceiling: max over the ALLOWED venues' server-authored caps. Absent = not known yet (never
  // a derived stand-in).
  maxLeverage?: number
  // The allowlist the quote was asked with, and how much of the pair it leaves out.
  allowedVenues: MarginVenue[]
  excludedCount: number
  hasEnteredAmount: boolean
  hasSufficientBalance: boolean
}

// Logoless fallback info; buildCurrencyInfo caches by content, so identity is render-stable.
function buildLocalCurrencyInfo(currency: Currency): CurrencyInfo {
  return buildCurrencyInfo({ currency, currencyId: currencyId(currency), logoUrl: null })
}

export function useDerivedMarginInfo({
  market,
  // Whether THIS mount reports venue-routed telemetry. Default off: the hook is a derive helper other
  // surfaces mount just to read a field, and each such mount would otherwise duplicate every event.
  reportVenueRouted = false,
}: {
  market: MarginMarket
  reportVenueRouted?: boolean
}): DerivedMarginInfo {
  const {
    side,
    marginAmount,
    leverage,
    paymentToken: storedPaymentToken,
    slippageToleranceBps,
  } = useMarginFormStore((s) => ({
    side: s.side,
    marginAmount: s.marginAmount,
    leverage: s.leverage,
    paymentToken: s.paymentToken,
    slippageToleranceBps: s.slippageToleranceBps,
  }))
  const account = useAccount()
  // The whole pair's venues minus the user's exclusions, not the resolved market's single one: the
  // server picks among the allowlist. Excluding every one leaves the builder with no request, which
  // is what disables the query.
  const { allowedMarkets, allowedVenues, excludedCount } = useMarginVenueAllowlist({ market })

  // Store value wins; otherwise the market default (collateral; native ETH on the ETH market).
  // Memoized: the default branch builds a fresh object, and an unstable identity would re-run
  // every downstream memo/balance/USD hook each render.
  const paymentToken = useMemo(
    () => storedPaymentToken ?? getMarketDefaultPaymentToken(market),
    [storedPaymentToken, market],
  )
  const paymentCurrency = useMemo(() => getPaymentCurrency(paymentToken), [paymentToken])
  // Resolve the real logo from the data API (mainnet chain + address); fall back to the local
  // no-logo info while it loads or if the token has no art.
  const paymentCurrencyInfo = useCurrencyInfo(currencyId(paymentCurrency)) ?? buildLocalCurrencyInfo(paymentCurrency)

  // One portfolio read across every supported source chain (mainnet + bridge sources). PortfolioBalance
  // exposes `quantity: number` (a float), not a CurrencyAmount — convert before comparison.
  const { data: portfolio, loading: isBalanceLoading } = usePortfolioBalances({
    evmAddress: account.address,
    chainIds: MARGIN_PAYMENT_SOURCE_CHAIN_IDS,
  })
  const balancesByNormalizedId = useMemo(() => {
    const map = new Map<string, PortfolioBalance>()
    for (const [id, entry] of Object.entries(portfolio ?? {})) {
      map.set(normalizeCurrencyIdForMapLookup(id), entry)
    }
    return map
  }, [portfolio])
  const balance = useMemo(() => {
    const entry = balancesByNormalizedId.get(normalizeCurrencyIdForMapLookup(currencyId(paymentCurrency)))
    if (!entry) {
      return undefined
    }
    // Prefer the exact base-unit string: `quantity` is a float64 that loses dust at the max edge and an
    // ERC20 has no gas buffer to absorb it. Fall back to the float when the API omits quantityRaw.
    const exact = entry.quantityRaw
      ? getCurrencyAmount({ value: entry.quantityRaw, valueType: ValueType.Raw, currency: paymentCurrency })
      : undefined
    return (
      exact ??
      getCurrencyAmount({ value: String(entry.quantity), valueType: ValueType.Exact, currency: paymentCurrency }) ??
      undefined
    )
  }, [balancesByNormalizedId, paymentCurrency])

  const isPaymentDifferentFromCollateral = isPaymentTokenDifferentFromCollateral({ token: paymentToken, market })

  const paymentCurrencyAmount =
    getCurrencyAmount({ value: marginAmount, valueType: ValueType.Exact, currency: paymentCurrency }) ?? undefined
  const paymentUsdValue = useUSDCValue(paymentCurrencyAmount)

  const [debouncedMarginAmount, isDebouncing] = useDebounceWithStatus({
    value: marginAmount,
    delay: MARGIN_DEBOUNCE_MS,
  })
  const debouncedAmount =
    getCurrencyAmount({ value: debouncedMarginAmount, valueType: ValueType.Exact, currency: paymentCurrency }) ??
    undefined
  const paymentAmountRaw = debouncedAmount?.quotient.toString()

  // The request can't await the quote for its own direction (chicken-and-egg) — market.direction covers
  // every wire-sourced market; the derivation only backstops a market built with no wire data at all.
  const requestDirection =
    market.direction ??
    marginMarketDirection({ collateralToken: market.collateral.address, debtToken: market.debt.address })
  const exposureToken = requestDirection === 'SHORT' ? market.debt.address : market.collateral.address
  const counterToken = requestDirection === 'SHORT' ? market.collateral.address : market.debt.address

  // Memoized: this object is the query key, and a fresh identity per render churns the
  // placeholderData closure and every downstream memo for no wire-level change.
  const quoteParams: MarginQuoteRequest | undefined = useMemo(
    () =>
      buildMarginOpenQuoteRequest({
        chainId: MARGIN_CHAIN_ID,
        exposureToken,
        counterToken,
        direction: requestDirection,
        swapper: account.address,
        leverage,
        equityAmountRaw: paymentAmountRaw,
        paymentToken: paymentToken.isNative ? MARGIN_NATIVE_TOKEN_ADDRESS : paymentToken.address,
        paymentChainId: paymentToken.chainId,
        slippageToleranceBps,
        // Already derived (deduped + sorted); the builder's own derive is a no-op over it.
        pairVenues: allowedVenues,
        excludedVenues: NO_EXCLUSIONS,
      }),
    [
      exposureToken,
      counterToken,
      requestDirection,
      account.address,
      leverage,
      paymentAmountRaw,
      paymentToken,
      slippageToleranceBps,
      allowedVenues,
    ],
  )

  const {
    data: quote,
    isLoading: isQuoteLoading,
    isFetching,
    isPlaceholderData,
    error: quoteError,
  } = useMarginQuoteQuery({
    params: quoteParams,
    refetchInterval: MARGIN_QUOTE_REFETCH_MS,
    staleTime: MARGIN_QUOTE_REFETCH_MS,
    // Bridge the prior quote across a LEVERAGE change (same market, new query key) so `quote`
    // never blanks mid-interaction — otherwise MarginSizeBlock's `if (!quote) return null` unmounts
    // the leverage popover on every slider move. But scope the bridge to the SAME market: the prior
    // quote's amounts are in the OLD collateral/debt decimals, and across a market switch
    // MarginSizeBlock would divide them by the NEW market's decimals (e.g. 18→8), rendering a
    // transient 10^10×-off size until the new quote resolves. Also drop it when the amount is
    // cleared (no params) so an empty input doesn't keep showing the last size.
    //
    // The bridge is deliberately kept across an ALLOWLIST change too — dropping it there would
    // unmount the whole size/leverage/liquidation block over a venue toggle. What it cannot carry
    // across is the ROUTED VENUE: selection is amount- and leverage-aware, so any bridged quote's
    // venue is provisional. Venue-derived fields gate on `isPlaceholderData` for exactly that
    // window; the amounts do not.
    // Through the SHARED predicate: this list and the manage path's drifted apart twice, each closing an
    // axis the other still bridged across. An absent `quoteParams` (amount cleared) refuses there too,
    // so an empty input stops showing the last size.
    placeholderData: (previousData, previousQuery) => {
      const previousParams = marginQuoteParamsFromKey(previousQuery?.queryKey ?? [])
      return isSameMarginQuoteSubject({ previous: previousParams, next: quoteParams }) ? previousData : undefined
    },
  })

  // The quote no longer carries a max (ceilings are markets/positions state now): the ceiling is a
  // client max over the ALLOWED venues' server-authored caps, so excluding the ceiling venue clamps
  // down immediately and re-including it widens again.
  const maxLeverage = getMarginLeverageCap({ markets: allowedMarkets })
  const hasEnteredAmount = Boolean(paymentCurrencyAmount?.greaterThan(0))
  // Native payment funds gas from the same balance on ANY chain — including an L2 bridge source, whose
  // own gas is paid in its native token — so reserve a buffer regardless of chain.
  // maxAmountSpend no-ops for ERC20s.
  const spendableBalance = getSpendablePaymentBalance({ paymentToken, balance })
  // The unified portfolio read returns only HELD tokens: once it has loaded, an absent balance means
  // the token isn't held → INSUFFICIENT. Stay permissive only until the first load lands (portfolio
  // still undefined) so the CTA isn't blocked prematurely — `loading` is isFetching (flips every poll),
  // so gate on data absence, not the flag.
  const hasSufficientBalance = !paymentCurrencyAmount
    ? false
    : spendableBalance
      ? !paymentCurrencyAmount.greaterThan(spendableBalance)
      : portfolio === undefined

  // Market wins (it's resolved independent of quote timing); the quote's own direction is only a
  // fallback for the brief window before the market registry carries it. marginMarketDirection is
  // total, so it must be last or it makes quote?.direction unreachable.
  const direction = market.direction ?? quote?.direction ?? requestDirection

  useMarginVenueRoutedAnalytics({
    pairKey: marginPairKey({ collateralToken: market.collateral.address, debtToken: market.debt.address }),
    direction,
    quote,
    quoteError,
    allowedVenues,
    excludedCount,
    leverage,
    equityUsd: paymentUsdValue ? Number(paymentUsdValue.toExact()) : undefined,
    // Only the REPORTING mount emits. This hook derives everything the form needs, so other surfaces
    // mount it just to read a field — the chart overlays do — and each extra mount is another copy of
    // every venue-routed event, since the dedupe is per effect instance.
    enabled: reportVenueRouted,
  })

  return {
    market,
    side,
    direction,
    paymentToken,
    paymentCurrency,
    paymentCurrencyInfo,
    paymentCurrencyAmount,
    paymentUsdValue,
    balance,
    isBalanceLoading,
    leverage,
    paymentAmountRaw,
    isPaymentDifferentFromCollateral,
    slippageToleranceBps,
    quote,
    isQuoteLoading,
    isFetching,
    isPlaceholderData,
    isDebouncing,
    quoteError,
    maxLeverage,
    allowedVenues,
    excludedCount,
    hasEnteredAmount,
    hasSufficientBalance,
  }
}
