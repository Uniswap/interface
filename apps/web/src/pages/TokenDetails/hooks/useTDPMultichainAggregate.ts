import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'

interface UseTDPMultichainAggregateResult {
  isMultichainAggregateView: boolean
  /** Ignores the network picker, for reads about the whole token rather than the selected chain. */
  isMultichainToken: boolean
}

/** Single source of truth for the "all networks" aggregate view, shared by the chart header and stats section so they can't drift on it. */
export function useTDPMultichainAggregate(): UseTDPMultichainAggregateResult {
  const multiChainMap = useTDPStore((s) => s.multiChainMap)
  const selectedMultichainChainId = useTDPStore((s) => s.selectedMultichainChainId)
  const multichainTokenLoaded = useTDPStore((s) => s.multichainTokenLoaded)

  const multichainEntries = useMultichainTokenEntries(multiChainMap)
  const isMultiChainAsset = multichainEntries.length > 1
  // Default to the aggregate view until we know otherwise — better than assuming single-chain.
  const isMultichainToken = !multichainTokenLoaded || isMultiChainAsset

  return { isMultichainAggregateView: isMultichainToken && selectedMultichainChainId === undefined, isMultichainToken }
}
