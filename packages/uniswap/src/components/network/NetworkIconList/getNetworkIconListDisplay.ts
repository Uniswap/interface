import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { logger } from 'utilities/src/logger/logger'

/** Show every network icon when there are at most this many unique chains. */
const MAX_FULL_ICON_COUNT = 4
/** When there are more than {@link MAX_FULL_ICON_COUNT} chains, show this many logos plus a +N badge. */
const ICON_COUNT_WHEN_OVERFLOW = 3

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
 * - At most 4 icons when ≤4 networks; otherwise first 3 icons + overflow count for the rest
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

  if (capped.length <= MAX_FULL_ICON_COUNT) {
    return { visibleChainIds: capped, overflowCount: 0 }
  }

  return {
    visibleChainIds: capped.slice(0, ICON_COUNT_WHEN_OVERFLOW),
    overflowCount: capped.length - ICON_COUNT_WHEN_OVERFLOW,
  }
}
