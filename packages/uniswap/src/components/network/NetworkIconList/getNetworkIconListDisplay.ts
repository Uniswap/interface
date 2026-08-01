import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { logger } from 'utilities/src/logger/logger'

/** Maximum network logos shown in {@link NetworkIconList}; additional chains use overflow count (+N badge when enabled). */
const MAX_VISIBLE_NETWORK_ICONS = 3

export interface NetworkIconListDisplay {
  visibleChainIds: UniverseChainId[]
  /** Additional networks beyond {@link visibleChainIds}; shown as a numeric badge (0 = no badge). */
  overflowCount: number
}

/**
 * Filters and deduplicates chain IDs for {@link NetworkIconList}.
 * - Keeps only supported chain IDs (via toSupportedChainId)
 * - Keeps only chain IDs that are in the enabled list
 * - Deduplicates while preserving order
 * - Shows at most {@link MAX_VISIBLE_NETWORK_ICONS} icons; remaining networks contribute to overflow count
 */
export function getNetworkIconListDisplay(
  chainIds: UniverseChainId[],
  enabledChainIds: UniverseChainId[],
): NetworkIconListDisplay {
  const enabledSet = new Set(enabledChainIds)
  const supported = chainIds
    .map((id) => toSupportedChainId(id))
    .filter((id): id is UniverseChainId => id != null)
    .filter((id) => enabledSet.has(id))

  const seen = new Set<UniverseChainId>()
  const deduped = supported.filter((id) => {
    if (seen.has(id)) {
      return false
    }
    seen.add(id)
    return true
  })

  if (deduped.length > enabledChainIds.length) {
    logger.warn(
      'getNetworkIconListDisplay',
      'getNetworkIconListDisplay',
      `NetworkIconList: received ${deduped.length} unique supported chain IDs, which exceeds the maximum of ${enabledChainIds.length}. Truncating.`,
      { dedupedLength: deduped.length, enabledChainIdsLength: enabledChainIds.length },
    )
  }

  const capped = deduped.slice(0, enabledChainIds.length)

  return {
    visibleChainIds: capped.slice(0, MAX_VISIBLE_NETWORK_ICONS),
    overflowCount: Math.max(0, capped.length - MAX_VISIBLE_NETWORK_ICONS),
  }
}
