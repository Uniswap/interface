import type { UniverseChainId } from '@universe/chains'
import { Button, Flex, Text } from '@universe/mycelium'
import { Sliders } from '@universe/mycelium/icons/Sliders'
import { TestID } from '@universe/test'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { COLLAPSED_SEARCH_WIDTH } from '~/components/ExpandableSearchInput/ExpandableSearchInput'
import { NetworkFilter } from '~/components/NetworkFilter/NetworkFilter'
import { PoolsFilterModal } from '~/features/Liquidity/PoolsFilter/PoolsFilterModal'
import { countActivePoolsFilters } from '~/features/Liquidity/PoolsFilter/toRequest'
import { EMPTY_POOLS_FILTER_STATE, type PoolsAprRange, type PoolsFilterState } from '~/types/poolsFilter'

/**
 * Shared pools-table filter cluster shown when the `AdvancedPoolsFiltering` flag is on: the surface's own
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
}: {
  search: ReactNode
  value: PoolsFilterState
  onApply: (value: PoolsFilterState) => void
  /** Min/max APR (percent) across the surface's loaded pools, shown as placeholder hints in the modal's APR fields. */
  aprRange?: PoolsAprRange
  /** Selectable chains for the network filters. Pools have no SVM support, so the surface passes its non-SVM set. */
  networks?: UniverseChainId[]
}): JSX.Element {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState(value)

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

  return (
    <Flex row gap="$spacing8" alignItems="center">
      {/* Network stays a top-level filter (also in the modal); changing it commits immediately. */}
      {/* `medium` = 40px, matching the search input and the flag-off toolbar controls. */}
      {/* `networks` restricts to the surface's supported (non-SVM) chains; `positionFixed` clamps the */}
      {/* dropdown against the viewport, both matching the flag-off TableNetworkFilter. */}
      <NetworkFilter
        currentChainId={value.chainId}
        onPress={(chainId) => onApply({ ...value, chainId })}
        showMultichainOption
        size="medium"
        networks={networks}
        positionFixed
      />
      <Flex position="relative">
        {/* Explicit box so the icon button isn't padding-squished; it borrows the collapsed search's
            footprint so the two sit as one pair. `size="small"` already matches its 12px radius.
            Sliders bakes a hardcoded near-black defaultFill when given no color, which ignores the
            theme — pass $neutral2, the weight the search glyph renders at (its path bakes 63% opacity). */}
        <Button
          size="small"
          emphasis="tertiary"
          icon={<Sliders color="$neutral2" />}
          fill={false}
          height={40}
          width={COLLAPSED_SEARCH_WIDTH}
          aria-label={
            activeCount > 0 ? t('pool.filter.buttonWithCount', { count: activeCount }) : t('pool.filter.button')
          }
          testID={TestID.PoolsFilterButton}
          onPress={openModal}
        />
        {activeCount > 0 && (
          // Count badge overlapping the button's top-right corner; pointer-events off so it never eats the tap.
          <Flex
            position="absolute"
            top={-4}
            right={-4}
            minWidth={16}
            height={16}
            px="$spacing2"
            borderRadius="$roundedFull"
            backgroundColor="$neutral1"
            alignItems="center"
            justifyContent="center"
            pointerEvents="none"
            testID={TestID.PoolsFilterButtonBadge}
          >
            <Text variant="buttonLabel4" color="$surface1">
              {activeCount}
            </Text>
          </Flex>
        )}
      </Flex>
      {search}
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
