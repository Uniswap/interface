import { isEVMChain, type UniverseChainId } from '@universe/chains'
import { Flex, type Input } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter/NetworkFilter'
import { ElementName, InterfaceEventName, InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { ExpandableSearchInput, WIDE_SEARCH_WIDTH } from '~/components/ExpandableSearchInput/ExpandableSearchInput'
import { useFilteredChainIds } from '~/components/NetworkFilter/useFilteredChains'
import { buildExploreUrl } from '~/features/Explore/utils/buildExploreUrl'
import { VolumeTimeFrameSelector } from '~/features/Explore/VolumeTimeFrameSelector'
import { countActiveHookFilters, EMPTY_HOOK_FILTER_STATE, type HookFilterState } from '~/features/Hooks/hookFilters'
import { PoolFilterButton } from '~/features/Liquidity/PoolsFilter/components'
import { HooksFilterModal } from '~/pages/Explore/tables/Hooks/HooksFilterModal'
import { HOOK_VOLUME_PERIODS } from '~/pages/Explore/tables/Hooks/hooksVolumePeriods'
import { ExploreTab } from '~/types/explore'

export function HooksTableFilters({
  chainId,
  search,
  onSearchChange,
  filters,
  onFiltersApply,
}: {
  chainId?: UniverseChainId
  search: string
  onSearchChange: (value: string) => void
  filters: HookFilterState
  onFiltersApply: (value: HookFilterState) => void
}): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { value: searchFocused, setTrue: focusSearch, setFalse: blurSearch } = useBooleanState(false)
  const { value: isOpen, setTrue: showModal, setFalse: closeModal } = useBooleanState(false)
  const [draft, setDraft] = useState(filters)
  const inputRef = useRef<Input>(null)
  const chainIds = useFilteredChainIds(undefined, { singleModeNetworks: true })
  const networks = useMemo(() => chainIds.filter(isEVMChain), [chainIds])
  const activeCount = countActiveHookFilters(filters)

  const openModal = (): void => {
    setDraft(filters)
    showModal()
  }
  const clearAll = (): void => {
    setDraft(EMPTY_HOOK_FILTER_STATE)
    onFiltersApply(EMPTY_HOOK_FILTER_STATE)
  }
  const apply = (): void => {
    onFiltersApply(draft)
    closeModal()
  }

  return (
    <>
      <Flex row position="relative" alignItems="center" gap="$spacing8" height={40}>
        <NetworkFilter
          trigger={{ variant: 'icon', outlined: true }}
          includeAllNetworks
          forceAllNetworksLabel
          placement="bottom-start"
          chainIds={networks}
          selectedChain={chainId ?? null}
          selectionAnalytics={{ page: InterfacePageName.ExplorePage, tab: ExploreTab.Hooks }}
          onPressChain={(nextChainId) =>
            navigate(buildExploreUrl({ tabName: ExploreTab.Hooks, chainId: nextChainId ?? undefined, searchParams }))
          }
        />
        <VolumeTimeFrameSelector supportedPeriods={HOOK_VOLUME_PERIODS} />
        <PoolFilterButton
          activeCount={activeCount}
          isOpen={isOpen}
          onPress={openModal}
          testID={TestID.HooksFilterButton}
          badgeTestID={TestID.HooksFilterButtonBadge}
        />
        <Flex grow />
        <Trace
          logFocus
          eventOnTrigger={InterfaceEventName.ExploreSearchSelected}
          element={ElementName.ExploreSearchInput}
        >
          <ExpandableSearchInput
            inputRef={inputRef}
            aria-label={t('hooks.list.search.label')}
            placeholder={t('hooks.list.search.placeholder')}
            value={search}
            onChangeText={onSearchChange}
            alwaysExpandedWidth={WIDE_SEARCH_WIDTH}
            isOpen={searchFocused || search !== ''}
            onFocus={focusSearch}
            onBlur={blurSearch}
            onClose={() => inputRef.current?.focus()}
            responsive
          />
        </Trace>
      </Flex>
      <HooksFilterModal
        isOpen={isOpen}
        onClose={closeModal}
        filters={draft}
        onChange={setDraft}
        onClearAll={clearAll}
        onApply={apply}
      />
    </>
  )
}
