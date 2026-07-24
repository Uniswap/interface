import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'

interface UseTDPMultichainAggregateResult {
  isMultichainAggregateView: boolean
}

/** Single source of truth for the "all networks" aggregate view, shared by the chart header and stats section so they can't drift on it. */
export function useTDPMultichainAggregate(): UseTDPMultichainAggregateResult {
  const multiChainMap = useTDPStore((s) => s.multiChainMap)
  const selectedMultichainChainId = useTDPStore((s) => s.selectedMultichainChainId)

  const multichainEntries = useMultichainTokenEntries(multiChainMap)
  const isMultiChainAsset = multichainEntries.length > 1
  const isMultichainAggregateView = isMultiChainAsset && selectedMultichainChainId === undefined

  return { isMultichainAggregateView }
}
