import { SharedEventName } from '@uniswap/analytics-events'
import { useCallback } from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useCopyClipboard } from 'utilities/src/react/useCopyClipboard'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

/**
 * Shared copy-to-clipboard + CopyAddress analytics for TDP address affordances
 * (desktop About section and mobile header). `copy` handles the single-chain
 * case; `onCopyMultichainAddress` handles a per-network entry from the address list.
 */
export function useTokenAddressCopy({
  displayAddress,
  chainId,
}: {
  displayAddress: string
  chainId: UniverseChainId
}): {
  isCopied: boolean
  copy: () => void
  onCopyMultichainAddress: (address: string, chainId: UniverseChainId) => void
} {
  const trace = useTrace()
  const [isCopied, setCopied] = useCopyClipboard(ONE_SECOND_MS)

  const logAddressCopied = useCallback(
    (copiedChainId: UniverseChainId) => {
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        ...trace,
        element: ElementName.CopyAddress,
        chain_name: getChainInfo(copiedChainId).urlParam,
      })
    },
    [trace],
  )

  const copy = useCallback(() => {
    setCopied(displayAddress)
    logAddressCopied(chainId)
  }, [displayAddress, chainId, logAddressCopied, setCopied])

  const onCopyMultichainAddress = useCallback(
    (address: string, copiedChainId: UniverseChainId) => {
      setCopied(address)
      logAddressCopied(copiedChainId)
    },
    [logAddressCopied, setCopied],
  )

  return { isCopied, copy, onCopyMultichainAddress }
}
