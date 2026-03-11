import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { logger } from 'utilities/src/logger/logger'

const MAX_DISPLAY_CHAIN_IDS = 3

/**
 * Filters and deduplicates chain IDs for display in NetworkIconList.
 * - Keeps only supported chain IDs (via toSupportedChainId)
 * - Keeps only chain IDs that are in the enabled list
 * - Deduplicates while preserving order
 * - Truncates to at most enabledChainIds.length (logs error if truncating)
 */
export function getDisplayChainIds(chainIds: UniverseChainId[], enabledChainIds: UniverseChainId[]): UniverseChainId[] {
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
    logger.error(
      new Error(
        `NetworkIconList: received ${deduped.length} unique supported chain IDs, which exceeds the maximum of ${enabledChainIds.length}. Truncating.`,
      ),
      { tags: { file: 'getDisplayChainIds', function: 'getDisplayChainIds' } },
    )
  }
  return deduped.slice(0, Math.min(MAX_DISPLAY_CHAIN_IDS, enabledChainIds.length))
}
