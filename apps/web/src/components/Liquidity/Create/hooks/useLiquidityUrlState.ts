import { Currency } from '@uniswap/sdk-core'
import { useCurrencyValidation } from 'components/Liquidity/Create/hooks/useCurrencyValidation'
import { PositionFlowStep, PositionState, PriceRangeState } from 'components/Liquidity/Create/types'
import { applyUrlMigrations } from 'components/Liquidity/parsers/migrations'
import {
  parseAsChainId,
  parseAsCurrencyAddress,
  parseAsDepositState,
  parseAsFeeData,
  parseAsHookAddress,
  parseAsPositionFlowStep,
  parseAsPriceRangeState,
} from 'components/Liquidity/parsers/urlParsers'
import type { DepositState } from 'components/Liquidity/types'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { getIsBrowserPage, MatchType, PageType } from 'hooks/useIsPage'
import { parseAsBoolean, parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { assume0xAddress } from 'utils/wagmi'

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

// Only sync URL state when on create position or migrate routes
// we use a function here so we can get the latest value of the pathname
// without re-rendering the component (only used in the function!)
function getIsSyncing() {
  const isCreatePosition = getIsBrowserPage(PageType.CREATE_POSITION, MatchType.STARTS_WITH)
  const isMigrateV3 = getIsBrowserPage(PageType.MIGRATE_V3, MatchType.STARTS_WITH)
  const isMigrateV2 = getIsBrowserPage(PageType.MIGRATE_V2, MatchType.STARTS_WITH)
  return isCreatePosition || isMigrateV3 || isMigrateV2
}

export function useLiquidityUrlState() {
  const { defaultChainId } = useEnabledChains()
  const [isMigrated, setIsMigrated] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Step uses push history for browser navigation
  const [historyState, setHistoryState] = useQueryState(
    'step',
    parseAsPositionFlowStep.withDefault(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER).withOptions({
      history: 'push',
      clearOnDefault: false,
      shallow: false,
    }),
  )

  // Other params use replace history
  const [replaceState, setReplaceState] = useQueryStates(replaceStateParser, {
    history: 'replace',
  })

  const { currencyA, currencyB, chain, fee, hook, priceRangeState, depositState } = replaceState

  // Apply URL parameter migrations for backwards compatibility
  useEffect(() => {
    const migrationResult = applyUrlMigrations(replaceState)

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
  }, [replaceState, setReplaceState])

  const parsedChainId = chain ?? undefined
  const supportedChainId = useSupportedChainId(parsedChainId) ?? defaultChainId
  const defaultInitialToken = nativeOnChain(supportedChainId)

  // Handle currency validation and loading
  const {
    currencyALoaded,
    currencyBLoaded,
    loadingA,
    loadingB,
    loading: currencyValidationLoading,
  } = useCurrencyValidation({
    currencyA,
    currencyB,
    defaultInitialToken,
    chainId: supportedChainId,
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
      // Only sync to URL when on create position routes and after migration is complete
      if (!getIsSyncing() || !isMigrated) {
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
        hook: hookAddress,
        priceRangeState: data.priceRangeState,
        depositState: data.depositState,
      })
    },
    [setReplaceState, isMigrated],
  )

  useEffect(() => {
    if (isMounted) {
      return
    }

    if (!currencyValidationLoading) {
      setIsMounted(true)
    }
  }, [currencyValidationLoading, isMounted])

  const loading = (currencyValidationLoading || !isMigrated) && !isMounted

  return useMemo(() => {
    return {
      // Read state
      defaultInitialToken,
      tokenA: currencyALoaded,
      tokenB: currencyBLoaded,
      fee,
      hook,
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
