import { Currency } from '@uniswap/sdk-core'
import { useStatsigClientStatus } from '@universe/gating'
import { parseAsBoolean, parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { CHAIN_ROLLOUT_FLAGS } from 'uniswap/src/features/chains/chainFeatureFlags'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { assume0xAddress } from '~/chains'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useCurrencyValidation } from '~/features/Liquidity/Create/hooks/useCurrencyValidation'
import { PositionFlowStep, PositionState, PriceRangeState } from '~/features/Liquidity/Create/types'
import { applyUrlMigrations } from '~/features/Liquidity/parsers/migrations'
import {
  parseAsChainId,
  parseAsCurrencyAddress,
  parseAsDepositState,
  parseAsFeeData,
  parseAsHookAddress,
  parseAsPriceRangeState,
  parseAsStep,
} from '~/features/Liquidity/parsers/urlParsers'
import { getProtocolVersionLabel } from '~/features/Liquidity/utils/protocolVersion'
import { getIsBrowserPage, MatchType, PageType } from '~/hooks/useIsPage'
import type { DepositState } from '~/types/liquidity'

// Parser for replace parameters (most params)
const replaceStateParser = {
  // Currency addresses
  currencyA: parseAsCurrencyAddress.withDefault(''),
  currencyB: parseAsCurrencyAddress.withDefault(''),

  // Chain
  chain: parseAsChainId,

  // Hook
  hook: parseAsHookAddress,

  // Fee data
  fee: parseAsFeeData,

  // Protocol version
  protocolVersion: parseAsString,

  // Price range state
  priceRangeState: parseAsPriceRangeState,

  // Deposit state
  depositState: parseAsDepositState,

  // Backwards compatibility for:
  // - feeTier
  // - isDynamic
  // - currencya
  // - currencyb
  feeTier: parseAsString,
  isDynamic: parseAsBoolean,
  currencya: parseAsCurrencyAddress.withDefault(''),
  currencyb: parseAsCurrencyAddress.withDefault(''),
}

/**
 * Cap on a single hold before the flow gives up and uses the pre-Statsig fallback (default chain, currency
 * params cleared, URL rewritten). Longer than a normal init round-trip, short enough that a stalled or
 * blocked Statsig endpoint degrades to the wrong chain rather than a blank page.
 *
 * Armed per engagement rather than once per mount, so a readiness regression before mount restarts the
 * window. That can only happen while Statsig is working — each cycle ends ready — and never after the first
 * expiry, which releases the hold for the rest of the mount. An init that never completes, the case this
 * guards, has nothing to clear the timer and so is still capped at one interval.
 */
export const CHAIN_ROLLOUT_READINESS_TIMEOUT_MS = 3 * ONE_SECOND_MS

// Only sync URL state when on create position or migrate routes
// we use a function here so we can get the latest value of the pathname
// without re-rendering the component (only used in the function!)
function getIsSyncing() {
  const isAddLiquidityNew = getIsBrowserPage(PageType.ADD_LIQUIDITY_NEW, MatchType.STARTS_WITH)
  const isAddLiquidityPool = getIsBrowserPage(PageType.ADD_LIQUIDITY, MatchType.INCLUDES)
  const isMigrateV3 = getIsBrowserPage(PageType.MIGRATE_V3, MatchType.STARTS_WITH)
  const isMigrateV2 = getIsBrowserPage(PageType.MIGRATE_V2, MatchType.STARTS_WITH)
  return isAddLiquidityNew || isAddLiquidityPool || isMigrateV3 || isMigrateV2
}

export function useLiquidityUrlState() {
  const { defaultChainId, isTestnetModeEnabled } = useEnabledChains()
  const { isStatsigReady } = useStatsigClientStatus()
  const [isMigrated, setIsMigrated] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Step uses push history for browser navigation
  const [historyState, setHistoryState] = useQueryState(
    'step',
    parseAsStep.withDefault(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER),
  )

  // Other params use replace history
  const [replaceState, setReplaceState] = useQueryStates(replaceStateParser, {
    history: 'replace',
  })

  // Deprecated params (`currencya`, `feeTier`, ...) are migrated during render, not only by the rewrite
  // effect below: the effect's `setReplaceState` lands a render late, and consumers freeze these inputs
  // on mount (CreatePositionContent), so a deep link using a deprecated spelling would otherwise latch an
  // empty form before the migrated values ever reached it. Deriving them here makes a deprecated link take
  // exactly the same first render as its canonical spelling; the effect still rewrites the URL.
  // The copy keeps `applyUrlMigrations` — which folds each migration's output back into its argument — off
  // the state object nuqs owns.
  const migrationResult = useMemo(() => applyUrlMigrations({ ...replaceState }), [replaceState])

  const { chain, hook, protocolVersion, priceRangeState, depositState } = replaceState
  const currencyA = migrationResult?.updatedParams.currencyA ?? replaceState.currencyA
  const currencyB = migrationResult?.updatedParams.currencyB ?? replaceState.currencyB
  const fee = migrationResult?.updatedParams.fee ?? replaceState.fee

  useEffect(() => {
    if (migrationResult) {
      const { updatedParams, clearParams } = migrationResult

      // Create the new state with migrated values and clear deprecated params
      const newState: Record<string, any> = {
        ...replaceState,
        ...updatedParams,
      }

      // Clear deprecated parameters
      for (const param of clearParams) {
        newState[param] = null
      }

      setReplaceState(newState)
    }

    setIsMigrated(true)
  }, [migrationResult, replaceState, setReplaceState])

  const parsedChainId = chain ?? undefined
  const resolvedChainId = useSupportedChainId(parsedChainId)
  const [hasReadinessTimedOut, setHasReadinessTimedOut] = useState(false)

  // Before Statsig initializes, chain rollout flags read as their default (false), so a launched-but-
  // flag-gated chain (Robinhood, Linea, Arc, ...) is transiently missing from the enabled chains. Treating
  // that as "unsupported" would collapse a valid preset link to the default chain, drop its currency
  // params, and rewrite the URL — permanently, since the form freezes these inputs on mount. `parsedChainId`
  // is always a known `UniverseChainId` (the parser rejects unknown slugs); only its enabled bit is unknown.
  //
  // Scoped tightly on purpose:
  // - only chains in `CHAIN_ROLLOUT_FLAGS`, since an app-unsupported chain is already final and would
  //   resolve no differently once Statsig is ready
  // - only when the chain's testnet-ness matches the current mode. `getEnabledChains` excludes a chain
  //   outright when it doesn't, so the flag is the only thing that could still change the outcome. Derived
  //   from the chain rather than the mode so a rollout-flagged testnet would be held rather than skipped
  // - only until `isMounted`, so a readiness regression after mount (`updateUserAsync` on wallet connect
  //   re-enters the `Loading` status) cannot start holding, blank the page, or drop a URL sync mid-session
  // - only until the timeout, so a stalled Statsig init degrades to the fallback instead of rendering
  //   nothing. The timer is keyed on this flag, so the cap is per engagement rather than from first render
  //   (see the constant); expiry latches and releases the hold for the rest of the mount
  const isChainSupportUnresolved =
    !isMounted &&
    !isStatsigReady &&
    !hasReadinessTimedOut &&
    parsedChainId !== undefined &&
    resolvedChainId === undefined &&
    parsedChainId in CHAIN_ROLLOUT_FLAGS &&
    isTestnetChain(parsedChainId) === isTestnetModeEnabled

  useEffect(() => {
    if (!isChainSupportUnresolved) {
      return undefined
    }

    const timeout = setTimeout(() => setHasReadinessTimedOut(true), CHAIN_ROLLOUT_READINESS_TIMEOUT_MS)
    return () => clearTimeout(timeout)
  }, [isChainSupportUnresolved])

  const supportedChainId = resolvedChainId ?? (isChainSupportUnresolved ? parsedChainId : defaultChainId)
  const defaultInitialToken = nativeOnChain(supportedChainId)

  // Check if URL chain doesn't match current testnet mode - if so, clear currency params
  const urlChainMismatch = parsedChainId !== undefined && resolvedChainId === undefined && !isChainSupportUnresolved

  // Handle currency validation and loading
  const {
    currencyALoaded,
    currencyBLoaded,
    loadingA,
    loadingB,
    loading: currencyValidationLoading,
  } = useCurrencyValidation({
    currencyA: urlChainMismatch ? undefined : currencyA,
    currencyB: urlChainMismatch ? undefined : currencyB,
    defaultInitialToken,
    chainId: supportedChainId,
    // Wait out the hold before looking anything up: the lookup would resolve on the default chain while
    // the URL's chain still reads as not-enabled, and its cached result would then be served as
    // placeholder data — reporting `loading: false` — for the real lookup once the chain resolves.
    skip: isChainSupportUnresolved,
  })

  // Sync callback to update URL with form state
  const syncToUrl = useCallback(
    (data: {
      currencyInputs: { tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }
      positionState: Partial<PositionState>
      priceRangeState: Partial<PriceRangeState>
      depositState: Partial<DepositState>
      flowStep?: PositionFlowStep
    }) => {
      // Only sync to URL when on create position routes, after migration is complete, and once the URL's
      // chain is known — syncing during the initial hold would rewrite `chain` to the default. The hold
      // ends at mount, so this never suppresses a sync for an already-rendered form.
      if (!getIsSyncing() || !isMigrated || isChainSupportUnresolved) {
        return
      }

      const tokenAAddress = data.currencyInputs.tokenA?.isNative ? NATIVE_CHAIN_ID : data.currencyInputs.tokenA?.address
      const tokenBAddress = data.currencyInputs.tokenB?.isNative ? NATIVE_CHAIN_ID : data.currencyInputs.tokenB?.address

      const hookAddress = data.positionState.hook ? assume0xAddress(data.positionState.hook) : undefined

      setReplaceState({
        currencyA: tokenAAddress,
        currencyB: tokenBAddress,
        chain: data.currencyInputs.tokenA?.chainId ?? data.currencyInputs.tokenB?.chainId,
        fee: data.positionState.fee,
        // `?protocolVersion` is the only carrier of the version — there is no path segment for it —
        // so it has to be written on every change, not just read at mount. Syncing it here rather
        // than at each switch site covers the version dropdown, the fee-on-transfer v2 fallback and
        // anything added later.
        protocolVersion:
          data.positionState.protocolVersion === undefined
            ? undefined
            : getProtocolVersionLabel(data.positionState.protocolVersion),
        hook: hookAddress,
        priceRangeState: data.priceRangeState,
        depositState: data.depositState,
      })
    },
    [setReplaceState, isMigrated, isChainSupportUnresolved],
  )

  useEffect(() => {
    if (isMounted) {
      return
    }

    if (!currencyValidationLoading && !isChainSupportUnresolved) {
      setIsMounted(true)
    }
  }, [currencyValidationLoading, isChainSupportUnresolved, isMounted])

  // Hold the flow unmounted until the chain's enabled bit is known, so consumers that freeze these inputs
  // on mount (CreatePositionContent) never latch onto the pre-init fallback chain.
  const loading = (currencyValidationLoading || !isMigrated || isChainSupportUnresolved) && !isMounted

  return useMemo(() => {
    return {
      // Read state
      defaultInitialToken,
      tokenA: currencyALoaded,
      tokenB: currencyBLoaded,
      fee,
      hook,
      protocolVersion,
      loading,
      loadingA,
      loadingB,
      priceRangeState,
      depositState,
      flowStep: historyState,
      chainId: supportedChainId,

      syncToUrl,
      setHistoryState,
    }
  }, [
    currencyALoaded,
    currencyBLoaded,
    fee,
    hook,
    protocolVersion,
    defaultInitialToken,
    loading,
    loadingA,
    loadingB,
    priceRangeState,
    depositState,
    historyState,
    supportedChainId,
    setHistoryState,
    syncToUrl,
  ])
}
