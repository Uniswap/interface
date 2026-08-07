import { useEffect, useMemo, useState } from 'react'
import { RwaTokenOption } from 'uniswap/src/components/lists/items/types'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { OnSelectRwaToken } from 'uniswap/src/components/TokenSelector/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfos, useCurrencyInfoWithLoading } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { getTokenProtectionWarning, getTokenWarningSeverity } from 'uniswap/src/features/tokens/warnings/safetyUtils'
import { useDismissedTokenWarnings } from 'uniswap/src/features/tokens/warnings/slice/hooks'
import TokenWarningModal from 'uniswap/src/features/tokens/warnings/TokenWarningModal'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

// If the token query hangs past this, stop waiting and fail open (select without a warning).
const PENDING_FETCH_TIMEOUT_MS = 3 * ONE_SECOND_MS

/** Stable per-token key shared by the section rows and the hook's `pendingTokenKey`. */
export function getStockKey(option: RwaTokenOption): string {
  return `${option.chainId}-${option.address}`
}

/**
 * Section-level selection logic for the Stocks row. Any tile/pill bubbles its tap here; the same `TokenWarningModal`
 * the vertical rows use is hosted once for the whole section and shown before the selection commits.
 *
 * Intentionally narrower than the vertical rows: only the token-protection warning is handled, not the
 * `BridgedAssetModal` path — stocks aren't bridged assets.
 */
export function useStocksSelectionWithWarning({
  tokens,
  onSelectRwaToken,
  showTokenWarnings,
}: {
  tokens: RwaTokenOption[]
  onSelectRwaToken: OnSelectRwaToken
  showTokenWarnings: boolean
}): {
  onPressStock: OnSelectRwaToken
  /** `getStockKey` of the tapped option while its token query is in flight, so the tile can show a pending state. */
  pendingTokenKey: string | null
  warningModal: JSX.Element | null
} {
  const [pendingOption, setPendingOption] = useState<RwaTokenOption | null>(null)

  // One batched `Tokens` query warms the same normalized `Token` cache entries the per-tap query below reads
  // (identical `TokenParts` selection + the `Query.token` cache redirect), so a tap usually resolves from cache with
  // no pending gap. On a cache miss the lazy per-tap fetch still works exactly as before.
  const prefetchCurrencyIds = useMemo(
    () => tokens.map((option) => buildCurrencyId(option.chainId, option.address)),
    [tokens],
  )
  useCurrencyInfos(prefetchCurrencyIds, { skip: !showTokenWarnings })

  // Lazy: undefined currencyId skips the query, so nothing is fetched until a tile is tapped. cache-first makes a
  // repeat tap instant.
  const currencyId = pendingOption ? buildCurrencyId(pendingOption.chainId, pendingOption.address) : undefined
  const { currencyInfo, loading } = useCurrencyInfoWithLoading(currencyId)

  const [fetchTimedOut, setFetchTimedOut] = useState(false)
  useEffect(() => {
    setFetchTimedOut(false)
    if (!pendingOption || !loading) {
      return undefined
    }
    const timer = setTimeout(() => setFetchTimedOut(true), PENDING_FETCH_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [pendingOption, loading])
  const isFetching = loading && !fetchTimedOut

  const severity = getTokenWarningSeverity(currencyInfo)
  const tokenProtectionWarning = getTokenProtectionWarning(currencyInfo)
  const { tokenWarningDismissed } = useDismissedTokenWarnings(currencyInfo?.currency, tokenProtectionWarning)

  const isBlocked = severity === WarningSeverity.Blocked
  const shouldShowWarningModal = isBlocked || (severity !== WarningSeverity.None && !tokenWarningDismissed)

  const commitSelection = useEvent(() => {
    const option = pendingOption
    setPendingOption(null)
    if (option) {
      onSelectRwaToken(option)
    }
  })

  const cancelSelection = useEvent(() => setPendingOption(null))

  const onPressStock = useEvent((option: RwaTokenOption) => {
    // Warnings gated off (e.g. Send flow) → select immediately, matching the vertical-row behavior.
    if (!showTokenWarnings) {
      onSelectRwaToken(option)
      return
    }
    setPendingOption(option)
  })

  // Selection is deferred until the token query resolves. A failed fetch (timeout, error, or empty result) fails
  // open — select with no warning rather than warn on fabricated data. Explicit product choice.
  useEffect(() => {
    if (!pendingOption || isFetching) {
      return
    }
    if (!currencyInfo || !shouldShowWarningModal) {
      commitSelection()
    }
  }, [pendingOption, isFetching, currencyInfo, shouldShowWarningModal, commitSelection])

  const isModalVisible = Boolean(pendingOption && !isFetching && shouldShowWarningModal && currencyInfo)

  // Keep the modal mounted with the last-shown info while it animates closed (matching TokenSelectorList), instead
  // of unmounting it the moment the pending option clears.
  const [displayedCurrencyInfo, setDisplayedCurrencyInfo] = useState<CurrencyInfo | null>(null)
  useEffect(() => {
    if (isModalVisible && currencyInfo) {
      setDisplayedCurrencyInfo(currencyInfo)
    }
  }, [isModalVisible, currencyInfo])

  // Stable element identity lets React bail out of re-rendering the mounted modal on unrelated section renders
  // (pending-tile flips, dismissal-store changes).
  const warningModal = useMemo(
    () =>
      displayedCurrencyInfo ? (
        <TokenWarningModal
          currencyInfo0={displayedCurrencyInfo}
          isVisible={isModalVisible}
          closeModalOnly={cancelSelection}
          onAcknowledge={commitSelection}
        />
      ) : null,
    [displayedCurrencyInfo, isModalVisible, cancelSelection, commitSelection],
  )

  const pendingTokenKey = pendingOption ? getStockKey(pendingOption) : null

  return { onPressStock, pendingTokenKey, warningModal }
}
