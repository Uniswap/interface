import { SharedEventName } from '@uniswap/analytics-events'
import type { UniverseChainId } from '@universe/chains'
import { useCallback } from 'react'
import { useMultichainAddressViewState } from 'uniswap/src/components/MultichainTokenDetails/useMultichainAddressViewState'
import { useMultichainEntriesFromCurrencyIds } from 'uniswap/src/components/MultichainTokenDetails/useMultichainEntriesFromCurrencyIds'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { CurrencyId } from 'uniswap/src/types/currency'
import type { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { useHoverCardCopyAndClose } from '~/components/HoverCard/hooks/useHoverCardCopyAndClose'

interface UseTokenHoverCardMultichainCopyParams {
  isOpen: boolean
  isMultichainAsset: boolean
  tokenCurrencyIds: CurrencyId[] | undefined
  contractAddress: string | undefined
  currencyInfo: CurrencyInfo | null | undefined
  chainId: UniverseChainId
  trace: ReturnType<typeof useTrace>
  onClose: () => void
}

interface UseTokenHoverCardMultichainCopyResult {
  viewIndex: number
  animationType: 'forward' | 'backward'
  orderedMultichainEntries: MultichainTokenEntry[]
  isCopied: boolean
  resetView: () => void
  goBack: () => void
  handleCopy: () => void
  handleCopyMultichainAddress: (address: string, chainId: UniverseChainId) => void
}

/**
 * Encapsulates TokenHoverCard's copy-address behavior: single-chain assets copy directly,
 * multichain assets switch the popover to a per-chain address list (via MultichainAddressTransitionPanel).
 */
export function useTokenHoverCardMultichainCopy({
  isOpen,
  isMultichainAsset,
  tokenCurrencyIds,
  contractAddress,
  currencyInfo,
  chainId,
  trace,
  onClose,
}: UseTokenHoverCardMultichainCopyParams): UseTokenHoverCardMultichainCopyResult {
  const { viewIndex, animationType, goToAddresses, goBack, resetView } = useMultichainAddressViewState()

  const closeAndResetView = useCallback((): void => {
    onClose()
    resetView()
  }, [onClose, resetView])
  const { isCopied, copyAndClose } = useHoverCardCopyAndClose({ onClose: closeAndResetView })

  const orderedMultichainEntries = useMultichainEntriesFromCurrencyIds(tokenCurrencyIds ?? [], {
    skip: !isOpen || !isMultichainAsset,
  })
  const isSingleChainCopy = orderedMultichainEntries.length <= 1

  const copyAndNotify = useCallback(
    (address: string, entryChainId: UniverseChainId): void => {
      copyAndClose(address)
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        ...trace,
        element: ElementName.TokenHoverCardCopyAddress,
        token_symbol: currencyInfo?.currency.symbol,
        chain_id: entryChainId,
        token_address: address,
        is_multichain: isMultichainAsset,
      })
    },
    [copyAndClose, trace, currencyInfo, isMultichainAsset],
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
    isCopied,
    resetView,
    goBack,
    handleCopy,
    handleCopyMultichainAddress: copyAndNotify,
  }
}
