import { useMemo } from 'react'
import {
  MARGIN_NATIVE_TOKEN_ADDRESS,
  type MarginPosition,
  type MarginQuoteRequest,
  type MarginQuoteResponse,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import {
  isSameMarginQuoteSubject,
  marginQuoteParamsFromKey,
  useMarginQuoteQuery,
} from 'uniswap/src/data/apiClients/tradingApi/useMarginQuoteQuery'
import { buildMarginQuoteRequest } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/buildMarginQuoteRequest'
import {
  resolveMarginActionKey,
  type MarginEquityChange,
  type MarginLeverageIntent,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/marginActionKey'
import { buildMarginSwapConfig } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/marginSwapConfig'
import type { MarginManageAction, MarginPaymentToken } from 'uniswap/src/features/transactions/margin/types'
import { useDebounceWithStatus } from 'utilities/src/time/timing'
import type { Address } from '~/chains'
import { MARGIN_CHAIN_ID, MARGIN_DEBOUNCE_MS, MARGIN_QUOTE_REFETCH_MS, type MarginMarket } from '~/constants/margin'
import { positionLeverage } from '~/pages/Swap/Margin/marginAdjustPositionMath'
import { bpsToPercent, scaledE18ToNumber } from '~/pages/Swap/Margin/marginFormat'
import { isMarginActivePosition } from '~/pages/Swap/Margin/marginPositionRow'

// Derived funding direction for an adjust (F3 computes this from the single margin input's ΔE —
// this hook never sees a user-picked Add/Withdraw mode).
export type AdjustFunding =
  | { kind: 'none' } // ΔE = 0 (untouched input / dust)
  | { kind: 'deposit'; paymentAmountRaw: string } // pay-token units, derived from ΔE
  | { kind: 'withdraw'; withdrawAmountRaw: string } // collateral units (= −ΔE)

export interface UseMarginQuoteParams {
  position: MarginPosition
  market: MarginMarket
  swapper?: Address
  // Which modal is asking. The four adjust actions all resolve their key off the two axes below, so
  // this only decides whether the key comes from the axes at all (`close` names itself).
  action: MarginManageAction
  funding?: AdjustFunding
  // Consumed only when funding.kind === 'deposit' / 'withdraw'; absent on the close path, which
  // moves no wallet-side balance.
  paymentToken?: MarginPaymentToken
  // Absent = debt-constant (Lock-leverage toggle off, untouched). Still a WAD string — shared with
  // marginAdjustPositionGate's echo-round-trip convention; re-scaled to decimal at the wire boundary.
  targetLeverageX18?: string
  slippageToleranceBps: number
  // Caller-side gate (the close panel's own). false leaves the query disabled outright.
  enabled?: boolean
}

export interface MarginQuoteResult {
  quote?: MarginQuoteResponse
  quoteError: Error | null
  isQuoteLoading: boolean
  // True through a placeholder-bridged refetch (unlike isQuoteLoading), so the CTA stays gated
  // while a stale placeholder quote is shown.
  isFetching: boolean
  isDebouncing: boolean
  isPlaceholderData: boolean
  // The combined key actually priced — for visible-matches-submitted checks.
  debouncedKey: string
}

function fundingAmountOf(funding: AdjustFunding): string | undefined {
  switch (funding.kind) {
    case 'deposit':
      return funding.paymentAmountRaw
    case 'withdraw':
      return funding.withdrawAmountRaw
    default:
      return undefined
  }
}

// The debounce/identity key for one manage quote. The payment token is the LAST pair of segments:
// Add margin types its amount directly in pay-token units, so switching tokens leaves
// kind+amount+leverage identical and the key would otherwise not move at all. Exported so the
// controller can build the same string for its visible-matches-submitted check — the two are compared
// verbatim, and any divergence disables the CTA forever.
//
// The token rides IN the key rather than being read live off the prop so the request can be built
// entirely from debounced values. Mixing a debounced amount with a live token fires an interim quote
// for {new token, old amount} — and since that response is real (not placeholder) data,
// useLastGoodQuote latches it.
export function marginQuoteKey({
  funding,
  targetLeverageX18,
  paymentToken,
}: {
  funding: AdjustFunding
  targetLeverageX18?: string
  paymentToken?: MarginPaymentToken
}): string {
  const wirePaymentToken = paymentToken
    ? paymentToken.isNative
      ? MARGIN_NATIVE_TOKEN_ADDRESS
      : paymentToken.address
    : ''
  return `${funding.kind}:${fundingAmountOf(funding) ?? ''}:${targetLeverageX18 ?? ''}:${wirePaymentToken}:${paymentToken?.chainId ?? ''}`
}

const NO_FUNDING: AdjustFunding = { kind: 'none' }

// The one manage-quote hook: close and all four adjust modals price through the same /margin/quote
// dispatcher, and the resolved action key is the only thing that differs between them. Funding (kind
// + amount) and target leverage share ONE debounce key so a deposit/withdraw and a leverage retarget
// never price against different targets mid-edit.
export function useMarginQuote({
  position,
  market,
  swapper,
  action,
  funding = NO_FUNDING,
  paymentToken,
  targetLeverageX18,
  slippageToleranceBps,
  enabled = true,
}: UseMarginQuoteParams): MarginQuoteResult {
  const key = marginQuoteKey({ funding, targetLeverageX18, paymentToken })
  const [debouncedKey, isDebouncing] = useDebounceWithStatus({ value: key, delay: MARGIN_DEBOUNCE_MS })

  const positionId = position.positionId
  const direction = position.direction
  const exposureToken = direction === 'SHORT' ? market.debt.address : market.collateral.address
  const counterToken = direction === 'SHORT' ? market.collateral.address : market.debt.address

  // 1 keeps this finite for a position with no finite leverage — an increase off any real target is
  // unambiguous either way.
  const currentLeverage = isMarginActivePosition(position) ? (positionLeverage(position) ?? 1) : 1

  const params: MarginQuoteRequest | undefined = useMemo(() => {
    if (!enabled) {
      return undefined
    }
    // Positional by construction: no segment can contain ':' (kind is a literal union, amounts and
    // leverage are decimal strings, the token is an address, the chain id is a number). Appending is
    // safe; inserting anywhere earlier would silently re-map the rest.
    const [debouncedKind, debouncedAmount, debouncedLeverage, debouncedPayToken, debouncedPayChainId] =
      debouncedKey.split(':')

    const leverageTarget = debouncedLeverage ? scaledE18ToNumber(debouncedLeverage).toString() : undefined
    const leverageIntent: MarginLeverageIntent =
      leverageTarget === undefined
        ? 'unchanged'
        : Number(leverageTarget) > currentLeverage
          ? 'increase'
          : Number(leverageTarget) < currentLeverage
            ? 'decrease'
            : 'hold'
    const equityChange: MarginEquityChange =
      debouncedKind === 'deposit' ? 'add' : debouncedKind === 'withdraw' ? 'withdraw' : 'none'
    const actionKey = resolveMarginActionKey({ formAction: action, equityChange, leverageIntent })
    if (!actionKey) {
      return undefined
    }

    return buildMarginQuoteRequest({
      actionKey,
      chainId: MARGIN_CHAIN_ID,
      exposureToken,
      counterToken,
      direction,
      swapper,
      positionId,
      leverageTarget,
      slippageTolerance: bpsToPercent(slippageToleranceBps),
      // The rail rides only on the keys that move equity — the builder drops it everywhere else.
      // The ACTION KEY alone decides how the server reads `amount`: an equity add is denominated in
      // the named token, a withdraw in the COLLATERAL, and a withdraw's token is discarded server-side.
      // So a withdraw's amount must arrive in collateral units whatever token the picker holds.
      swapConfig: buildMarginSwapConfig({
        token: debouncedPayToken,
        chainId: debouncedPayChainId ? Number(debouncedPayChainId) : undefined,
        amountRaw: debouncedAmount,
        slippageToleranceBps,
      }),
    })
  }, [
    enabled,
    debouncedKey,
    action,
    currentLeverage,
    exposureToken,
    counterToken,
    direction,
    swapper,
    positionId,
    slippageToleranceBps,
  ])

  const {
    data: quote,
    isLoading: isQuoteLoading,
    isFetching,
    isPlaceholderData,
    error: quoteError,
  } = useMarginQuoteQuery({
    params,
    refetchInterval: MARGIN_QUOTE_REFETCH_MS,
    staleTime: MARGIN_QUOTE_REFETCH_MS,
    // Keep the prior quote visible across a param change (leverage drag, ΔE edit) so the before/after
    // rows don't blank mid-edit; callers gate submission on isPlaceholderData.
    //
    // Scoped to the same SUBJECT. Unscoped, this bridges across any key change, so switching wallets
    // with a manage modal open renders the previous account's pricing, and a modal instance reused
    // across positions renders amounts denominated in the previous market's decimals — both sitting in
    // the before/after rows with only isPlaceholderData between them and submit. Through the SHARED
    // predicate, not a list spelled here: the open path's copy and this one drifted apart twice.
    placeholderData: (previous: MarginQuoteResponse | undefined, previousQuery) => {
      const previousParams = marginQuoteParamsFromKey(previousQuery?.queryKey ?? [])
      return isSameMarginQuoteSubject({ previous: previousParams, next: params }) ? previous : undefined
    },
  })

  return { quote, quoteError, isQuoteLoading, isFetching, isDebouncing, isPlaceholderData, debouncedKey }
}
