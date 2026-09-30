import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import type { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex } from '@universe/mycelium'
import { createSerializer, useQueryStates } from 'nuqs'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { Button } from 'ui/src'
import { Plus } from 'ui/src/components/icons/Plus'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { ExpandableSearchInput } from '~/components/ExpandableSearchInput/ExpandableSearchInput'
import { NetworkFilter } from '~/components/NetworkFilter/NetworkFilter'
import { CurrencySearchModal } from '~/components/SearchModal/CurrencySearchModal'
import { STICKY_HEADER_TOP_GAP } from '~/components/Table/constants'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { PoolSortFields } from '~/data/pools/poolStats'
import { OrderDirection } from '~/data/util'
import { getNextFlowStep } from '~/features/Liquidity/Create/flowSteps'
import { PositionFlowStep } from '~/features/Liquidity/Create/types'
import { CurrencySelector } from '~/features/Liquidity/CurrencySelector'
import { usePoolsAprRange } from '~/features/Liquidity/PoolsFilter/aprRange'
import { PoolsFilter } from '~/features/Liquidity/PoolsFilter/PoolsFilter'
import { getProtocolVersionFromLabel } from '~/features/Liquidity/utils/protocolVersion'
import { useDebounce } from '~/hooks/useDebounce'
import { buildPoolSearchParams } from '~/pages/AddLiquidity/poolLinkParams'
import {
  BROWSER_FILTER_PARSERS,
  useCreatePoolHrefFromSelection,
  useResolvedBrowserSelection,
} from '~/pages/AddLiquidity/useCreatePoolHrefFromSelection'
import { useV2ListPools } from '~/pages/Explore/hooks/useV2ListPools'
import { ProtocolFilter } from '~/pages/Explore/ProtocolFilter'
import type { PoolLinkData } from '~/pages/Explore/tables/Pools/PoolTable'
import { PoolsTable } from '~/pages/Explore/tables/Pools/PoolTable'
import { usePoolTableStore } from '~/pages/Explore/tables/Pools/poolTableStore'
import { SwitchNetworkAction } from '~/state/popups/types'
import type { PoolsFilterState } from '~/types/poolsFilter'
import { getChainUrlParam, useChainIdFromUrlParam } from '~/utils/params/chainParams'

const FEW_RESULTS_THRESHOLD = 10

// The token selectors sit in the table toolbar beside the network filter, whose chevron is $neutral2
// at 20px. Without this they'd render $neutral1 at the glyph's own 24px default.
const TOOLBAR_CHEVRON = { chevronColor: '$neutral2', chevronSize: '$icon.20' } as const

// Writes the filters onto a pool link with the same parsers the table reads them back with, so the
// two directions can't drift apart.
const serializeBrowserFilters = createSerializer(BROWSER_FILTER_PARSERS)

export function PoolBrowser(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const entryPoint = (location.state as { entryPoint?: string } | null)?.entryPoint

  // Selected-row highlight.
  const { poolAddress: selectedPoolId } = useParams<{ poolAddress?: string }>()
  const selectedPoolChainId = useChainIdFromUrlParam()

  const isAdvancedPoolsFilteringEnabled = useFeatureFlag(FeatureFlags.AdvancedPoolsFiltering)

  const [browserUrlState, setBrowserUrlState] = useQueryStates(BROWSER_FILTER_PARSERS, { history: 'replace' })

  const [currencySearchInputState, setCurrencySearchInputState] = useState<'token0' | 'token1' | undefined>(undefined)

  const selectedChainId = browserUrlState.filterChain ?? undefined

  // One derivation for the selectors and both "+ Create pool" CTAs, so they cannot disagree about
  // which tokens are selected or which chain they live on.
  const {
    currencyAInfo: currency0Info,
    currencyBInfo: currency1Info,
    chainId: tokenChainId,
  } = useResolvedBrowserSelection()
  const currency0 = currency0Info?.currency
  const currency1 = currency1Info?.currency

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      const address = currency.isNative ? NATIVE_CHAIN_ID : currency.address
      // Both slots resolve against the one shared chain, so a slot left behind on the old chain gets
      // re-resolved on the new one — silently repointing it (the `NATIVE` sentinel resolves anywhere)
      // instead of dropping it. Clear it in the same update, so no render sees the stale pairing.
      const dropsOppositeSlot = currency.chainId !== tokenChainId
      if (currencySearchInputState === 'token0') {
        setBrowserUrlState({
          filterCurrencyA: address,
          ...(dropsOppositeSlot && { filterCurrencyB: '' }),
          filterChain: currency.chainId,
          filterTokenChain: currency.chainId,
        })
      } else if (currencySearchInputState === 'token1') {
        setBrowserUrlState({
          filterCurrencyB: address,
          ...(dropsOppositeSlot && { filterCurrencyA: '' }),
          filterChain: currency.chainId,
          filterTokenChain: currency.chainId,
        })
      }
      setCurrencySearchInputState(undefined)
    },
    [currencySearchInputState, setBrowserUrlState, tokenChainId],
  )

  // Drop `filterTokenChain` with the last token: it records the chain the *selection* lives on, so
  // leaving it behind an empty selection would strand a chain in the URL that describes nothing.
  const handleClearCurrency0 = useCallback(() => {
    setBrowserUrlState(
      browserUrlState.filterCurrencyB ? { filterCurrencyA: '' } : { filterCurrencyA: '', filterTokenChain: null },
    )
  }, [setBrowserUrlState, browserUrlState.filterCurrencyB])

  const handleClearCurrency1 = useCallback(() => {
    setBrowserUrlState(
      browserUrlState.filterCurrencyA ? { filterCurrencyB: '' } : { filterCurrencyB: '', filterTokenChain: null },
    )
  }, [setBrowserUrlState, browserUrlState.filterCurrencyA])

  const handleChainSelect = useCallback(
    (chainId: UniverseChainId | undefined) => {
      const hasTokens = Boolean(browserUrlState.filterCurrencyA || browserUrlState.filterCurrencyB)
      if (hasTokens && chainId !== undefined && chainId !== tokenChainId) {
        setBrowserUrlState({ filterChain: chainId, filterCurrencyA: '', filterCurrencyB: '', filterTokenChain: null })
      } else {
        setBrowserUrlState({ filterChain: chainId ?? null })
      }
    },
    [setBrowserUrlState, tokenChainId, browserUrlState.filterCurrencyA, browserUrlState.filterCurrencyB],
  )

  const handlePoolsFilterApply = useCallback(
    (next: PoolsFilterState) => {
      const hasTokens = Boolean(browserUrlState.filterCurrencyA || browserUrlState.filterCurrencyB)
      // Keep `filterChain` in sync with the filter's chain so `selectedChainId` — the currency
      // picker's default chain — tracks it; on a real chain switch also clear a token stranded on the
      // old chain, along with the chain recorded for the selection. Mirrors the flag-off
      // handleChainSelect.
      if (hasTokens && next.chainId !== undefined && next.chainId !== tokenChainId) {
        setBrowserUrlState({
          poolsFilter: next,
          filterChain: next.chainId,
          filterCurrencyA: '',
          filterCurrencyB: '',
          filterTokenChain: null,
        })
      } else {
        setBrowserUrlState({ poolsFilter: next, filterChain: next.chainId ?? null })
      }
    },
    [setBrowserUrlState, tokenChainId, browserUrlState.filterCurrencyA, browserUrlState.filterCurrencyB],
  )

  // UNSPECIFIED is "All", which clears the param rather than serializing a value.
  const selectedProtocol = browserUrlState.filterProtocol ?? ProtocolVersion.UNSPECIFIED

  const handleProtocolSelect = useCallback(
    (protocol: ProtocolVersion) => {
      setBrowserUrlState({ filterProtocol: protocol === ProtocolVersion.UNSPECIFIED ? null : protocol })
    },
    [setBrowserUrlState],
  )

  const [filterString, setFilterString] = useState('')
  const debouncedFilterString = useDebounce(filterString, 300)

  const { sortMethod, sortAscending } = usePoolTableStore((s) => ({
    sortMethod: s.sortMethod,
    sortAscending: s.sortAscending,
  }))

  const {
    pools,
    isLoading,
    isError,
    loadMore: backendLoadMore,
    hasNextPage,
    chainId: listChainId,
  } = useV2ListPools({
    currency0,
    currency1,
    // With the advanced filter on, its Network drives the chain (falling back to a selected token's chain);
    // don't also feed `filterChain`, or a chain left over from a since-cleared token would keep scoping the table.
    chainId: isAdvancedPoolsFilteringEnabled ? undefined : selectedChainId,
    protocol: selectedProtocol,
    poolsFilter: isAdvancedPoolsFilteringEnabled ? browserUrlState.poolsFilter : undefined,
    filterString: debouncedFilterString,
    sortState: {
      sortBy: sortMethod,
      sortDirection: sortAscending ? OrderDirection.Asc : OrderDirection.Desc,
    },
  })

  const getPoolLink = useCallback(
    (pool: PoolLinkData) => {
      const base = `/positions/add/${getChainUrlParam(pool.chainId)}/${pool.poolIdOrHash}`
      const params = buildPoolSearchParams({
        currencyA: pool.token0Address ?? NATIVE_CHAIN_ID,
        currencyB: pool.token1Address ?? NATIVE_CHAIN_ID,
        chain: getChainUrlParam(pool.chainId),
        fee: pool.fee,
        hookAddress: pool.hookAddress,
        protocolVersion: pool.protocolVersion,
      })
      // Seed the flow `step` so the row click lands directly on the form. Browser pools always exist,
      // so creatingPoolOrPair is false.
      const nextStep = getNextFlowStep({
        currentStep: PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER,
        protocolVersion: getProtocolVersionFromLabel(pool.protocolVersion) ?? ProtocolVersion.V4,
        creatingPoolOrPair: false,
      })
      params.set('step', String(nextStep))
      // Carry over the active table filter so selecting a pool doesn't reset it.
      return `${base}${serializeBrowserFilters(params, browserUrlState)}`
    },
    [browserUrlState],
  )

  const createPoolHref = useCreatePoolHrefFromSelection()

  const showCreatePool = !isLoading && !hasNextPage && pools && pools.length > 0 && pools.length < FEW_RESULTS_THRESHOLD

  const aprRange = usePoolsAprRange(pools)

  return (
    <>
      {/* Token selectors + Filters row. Scrolled horizontally in its own bounds on mobile (rather
          than wrapped) so the whole page never gains a document-level horizontal scrollbar. */}
      <Flex
        row
        justifyContent="space-between"
        alignItems="center"
        width="100%"
        maxWidth="100%"
        gap="$spacing16"
        height="40px"
        mb="$spacing16"
        className="scrollbar-hidden"
        $md={{ justifyContent: 'flex-start', '$platform-web': { overflowX: 'auto' } }}
      >
        {/* `fill={false}` on both: filling would make each selector `flex: 1 basis-0` and split this
            row's width evenly, leaving the wider placeholder ("Token 2") ~1.5px short and ellipsized. */}
        <Flex row gap="$spacing8" height="100%">
          <CurrencySelector
            {...TOOLBAR_CHEVRON}
            fill={false}
            currencyInfo={currency0Info}
            onPress={() => setCurrencySearchInputState('token0')}
            onClear={handleClearCurrency0}
            placeholder={t('addLiquidity.tokenOne')}
            emphasis="tertiary"
            index={0}
          />
          <CurrencySelector
            {...TOOLBAR_CHEVRON}
            fill={false}
            currencyInfo={currency1Info}
            onPress={() => setCurrencySearchInputState('token1')}
            onClear={handleClearCurrency1}
            placeholder={t('addLiquidity.tokenTwo')}
            emphasis="tertiary"
            index={1}
          />
        </Flex>
        <Flex row gap="$spacing8" alignItems="center" height="100%">
          {isAdvancedPoolsFilteringEnabled ? (
            <PoolsFilter
              search={
                <ExpandableSearchInput
                  value={filterString}
                  onChangeText={setFilterString}
                  placeholder={t('tokens.table.search.placeholder.pools')}
                />
              }
              value={browserUrlState.poolsFilter}
              onApply={handlePoolsFilterApply}
              aprRange={aprRange}
            />
          ) : (
            <>
              <ExpandableSearchInput
                value={filterString}
                onChangeText={setFilterString}
                placeholder={t('tokens.table.search.placeholder.pools')}
              />
              <ProtocolFilter
                selectedProtocol={selectedProtocol}
                onSelectProtocol={handleProtocolSelect}
                surface="add-liquidity-pool-browser"
              />
              {/* positionFixed: this row's `overflowX: 'auto'` (set above, under `$md`) forces overflow-y
                  to compute as `auto` too, clipping an inline-absolute menu. adaptToSheet only portals
                  below the `sm` breakpoint, so this trigger is still exposed between `sm` and `md`. */}
              <NetworkFilter
                position="right"
                onPress={handleChainSelect}
                currentChainId={selectedChainId}
                positionFixed
              />
            </>
          )}
        </Flex>
      </Flex>

      {/* The table renders its own error state, and only when it has no rows to show — a failed
          load-more keeps the pools already listed. */}
      <PoolsTable
        pools={pools}
        loading={isLoading}
        error={isError}
        loadMore={backendLoadMore}
        // Matches the page's own PageLayout maxWidth (Create/Container.tsx) — activates the shared
        // Table's pinned-column/auto-expand behavior below that width instead of overflowing it.
        maxWidth={1200}
        hiddenColumns={[PoolSortFields.VolOverTvl, PoolSortFields.Volume30D]}
        hideIndex
        getLink={getPoolLink}
        linkState={entryPoint ? { entryPoint } : undefined}
        selectedPoolId={selectedPoolId}
        selectedPoolChainId={selectedPoolChainId}
        // The list's chain filter (network/advanced filter, else a selected token's chain); undefined = all networks
        chainId={listChainId}
        surface="add-liquidity-pool-browser"
        // Matches the step sidebar's own sticky offset, so the header row and the card's top edge
        // land on the same line and both clear the app header.
        stickyTopOffset={STICKY_HEADER_TOP_GAP}
        filterString={debouncedFilterString}
      />
      {showCreatePool && (
        <Flex alignItems="center" mt="$spacing16">
          <Button
            fill={false}
            emphasis="text-only"
            icon={<Plus color="$neutral2" />}
            onPress={() => navigate(createPoolHref)}
          >
            <Button.Text color="$neutral2">{t('addLiquidity.createNewPool')}</Button.Text>
          </Button>
        </Flex>
      )}

      {/* Currency search modal. Default the token list to the chain picked in the network filter;
          when none is selected (`selectedChainId` undefined) pass `null` so it opens to All Networks
          instead of falling back to the connected account's chain. */}
      <CurrencySearchModal
        isOpen={currencySearchInputState !== undefined}
        onDismiss={() => setCurrencySearchInputState(undefined)}
        switchNetworkAction={SwitchNetworkAction.LP}
        onCurrencySelect={handleCurrencySelect}
        chainId={selectedChainId ?? null}
        flow={TokenSelectorFlow.Liquidity}
      />
    </>
  )
}
