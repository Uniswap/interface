import type { UniverseChainId } from '@universe/chains'
import { Flex } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter/NetworkFilter'
import { useNetworkSelectorOptions } from 'uniswap/src/components/network/NetworkFilter/useNetworkSelectorOptions'
import { COLLAPSED_SEARCH_WIDTH } from '~/components/ExpandableSearchInput/ExpandableSearchInput'
import { useNetworkFilterChainIds } from '~/components/NetworkFilter/useFilteredChains'
import { useActiveAddresses } from '~/connection/accounts/hooks'
import { PoolFilterButton } from '~/features/Liquidity/PoolsFilter/components'
import { PoolsFilterModal } from '~/features/Liquidity/PoolsFilter/PoolsFilterModal'
import { countActivePoolsFilters } from '~/features/Liquidity/PoolsFilter/toRequest'
import { EMPTY_POOLS_FILTER_STATE, type PoolsAprRange, type PoolsFilterState } from '~/types/poolsFilter'

export type PoolsFilterLayout = 'inline' | 'poolArea'

/**
 * Shared pools-table filter cluster: the surface's own
 * search control plus a Filter button that opens the {@link PoolsFilterModal}. Rendered by both the Explore
 * pools tab and the add-liquidity pool browser so they stay in sync.
 *
 * Controlled: `value` is the committed filter each surface stores (Explore's store plus its URL chain
 * segment, the pool browser's URL params) and reads into its pool query. The modal edits a local draft
 * rather than committing per keystroke, so the table doesn't refetch as the user types. Two actions commit
 * through `onApply`: "Apply" (the draft, and it dismisses) and "Clear all" (the empty state, staying open) —
 * see `clearAll` below.
 */
export function PoolsFilter({
  search,
  value,
  onApply,
  aprRange,
  networks,
  layout = 'inline',
  periodSelector,
}: {
  search: ReactNode
  value: PoolsFilterState
  onApply: (value: PoolsFilterState) => void
  /** Min/max APR (percent) across the surface's loaded pools, shown as placeholder hints in the modal's APR fields. */
  aprRange?: PoolsAprRange
  /** Selectable chains for the network filters. Pools have no SVM support, so the surface passes its non-SVM set. */
  networks?: UniverseChainId[]
  layout?: PoolsFilterLayout
  periodSelector?: ReactNode
}): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const isPoolArea = layout === 'poolArea'

  // Badge reflects the committed filter, not the in-modal draft, so it tracks what's actually applied.
  const activeCount = countActivePoolsFilters(value)

  const openModal = (): void => {
    setDraft(value) // seed the draft from the committed filter each time the modal opens
    setIsOpen(true)
  }
  const closeModal = (): void => setIsOpen(false)
  // Commits straight through instead of only resetting the draft: clearing is the one action with no
  // "are you sure" step, so it should land on the table without a second trip through Apply. The modal
  // stays open so a fresh filter can be built from the cleared state.
  const clearAll = (): void => {
    setDraft(EMPTY_POOLS_FILTER_STATE)
    onApply(EMPTY_POOLS_FILTER_STATE)
  }
  const apply = (): void => {
    onApply(draft)
    setIsOpen(false)
  }
  const { chainIds, allNetworksChainIds } = useNetworkFilterChainIds(networks)
  const activeAddresses = useActiveAddresses()
  const tieredNetworkOptions = useNetworkSelectorOptions({ addresses: activeAddresses, chainIds })

  return (
    <Flex
      row
      gap="$spacing8"
      alignItems="center"
      width={isPoolArea ? '100%' : undefined}
      position={isPoolArea ? 'relative' : undefined}
    >
      {/* Network stays a top-level filter (also in the modal); changing it commits immediately. */}
      <NetworkFilter
        trigger={{ variant: 'pill' }}
        placement={isPoolArea ? 'bottom-start' : 'bottom-end'}
        includeAllNetworks
        chainIds={chainIds}
        allNetworksChainIds={allNetworksChainIds}
        selectedChain={value.chainId ?? null}
        tieredOptions={tieredNetworkOptions}
        onPressChain={(chainId) => onApply({ ...value, chainId: chainId ?? undefined })}
      />
      {periodSelector}
      <PoolFilterButton
        activeCount={activeCount}
        isOpen={isOpen}
        onPress={openModal}
        testID={TestID.PoolsFilterButton}
        badgeTestID={TestID.PoolsFilterButtonBadge}
        mobileBadgeTop={isPoolArea ? 0 : undefined}
      />
      {isPoolArea ? (
        // Keep the mobile search overlay anchored to the whole toolbar rather than this trailing slot.
        <Flex row ml="auto" height={40} position="static" $md={{ width: COLLAPSED_SEARCH_WIDTH }}>
          {search}
        </Flex>
      ) : (
        search
      )}
      <PoolsFilterModal
        isOpen={isOpen}
        onClose={closeModal}
        value={draft}
        onChange={setDraft}
        onClearAll={clearAll}
        onApply={apply}
        aprRange={aprRange}
        networks={networks}
      />
    </Flex>
  )
}
