import { SharedEventName } from '@uniswap/analytics-events'
import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { useMultichainAddressViewState } from 'uniswap/src/components/MultichainTokenDetails/useMultichainAddressViewState'
import { useMultichainEntriesFromCurrencyIds } from 'uniswap/src/components/MultichainTokenDetails/useMultichainEntriesFromCurrencyIds'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { COPY_CLOSE_DELAY } from 'uniswap/src/constants/misc'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { CurrencyId } from 'uniswap/src/types/currency'
import type { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

interface UseTokenHoverCardMultichainCopyParams {
  isOpen: boolean
  isMultichainAsset: boolean
  tokenCurrencyIds: CurrencyId[] | undefined
  contractAddress: string | undefined
  currencyInfo: CurrencyInfo | null | undefined
  chainId: UniverseChainId
  copyToClipboard: (address: string) => void
  trace: ReturnType<typeof useTrace>
  setIsOpen: Dispatch<SetStateAction<boolean>>
}

interface UseTokenHoverCardMultichainCopyResult {
  viewIndex: number
  animationType: 'forward' | 'backward'
  orderedMultichainEntries: MultichainTokenEntry[]
  resetView: () => void
  goBack: () => void
  handleCopy: () => void
  handleCopyMultichainAddress: (address: string, chainId: UniverseChainId) => void
}

/**
 * Encapsulates TokenHoverCard's copy-address behavior: single-chain assets copy directly,
 * multichain assets switch the popover to a per-chain address list (via MultichainAddressTransitionPanel).
 * Either kind of copy dismisses the card shortly after, matching the Portfolio tokens table context menu.
 */
export function useTokenHoverCardMultichainCopy({
  isOpen,
  isMultichainAsset,
  tokenCurrencyIds,
  contractAddress,
  currencyInfo,
  chainId,
  copyToClipboard,
  trace,
  setIsOpen,
}: UseTokenHoverCardMultichainCopyParams): UseTokenHoverCardMultichainCopyResult {
  const dispatch = useDispatch()
  const { viewIndex, animationType, goToAddresses, goBack, resetView } = useMultichainAddressViewState()
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const orderedMultichainEntries = useMultichainEntriesFromCurrencyIds(tokenCurrencyIds ?? [], {
    skip: !isOpen || !isMultichainAsset,
  })
  const isSingleChainCopy = orderedMultichainEntries.length <= 1

  const copyAndNotify = useCallback(
    (address: string, entryChainId: UniverseChainId): void => {
      copyToClipboard(address)
      dispatch(
        pushNotification({
          type: AppNotificationType.Copied,
          copyType: CopyNotificationType.ContractAddress,
        }),
      )
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        ...trace,
        element: ElementName.TokenHoverCardCopyAddress,
        token_symbol: currencyInfo?.currency.symbol,
        chain_id: entryChainId,
        token_address: address,
        is_multichain: isMultichainAsset,
      })
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = setTimeout(() => {
        setIsOpen(false)
        resetView()
      }, COPY_CLOSE_DELAY)
    },
    [copyToClipboard, dispatch, trace, currencyInfo, isMultichainAsset, setIsOpen, resetView],
  )

  const handleCopy = useCallback((): void => {
    if (!contractAddress) {
      return
    }
    // Multichain: switch the popover content to the per-chain address list instead of copying directly
    if (isMultichainAsset && !isSingleChainCopy) {
      goToAddresses()
      return
    }
    copyAndNotify(contractAddress, chainId)
  }, [contractAddress, isMultichainAsset, isSingleChainCopy, goToAddresses, copyAndNotify, chainId])

  return {
    viewIndex,
    animationType,
    orderedMultichainEntries,
    resetView,
    goBack,
    handleCopy,
    handleCopyMultichainAddress: copyAndNotify,
  }
}
