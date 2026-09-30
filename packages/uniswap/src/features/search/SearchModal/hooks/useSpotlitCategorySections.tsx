import { useQueries, type UseQueryResult } from '@tanstack/react-query'
import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { ListTokensResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { HistoryDuration, TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { UniverseChainId } from '@universe/chains'
import { GatedFeature, useIsFeatureGated } from '@universe/compliance'
import {
  DynamicConfigs,
  TokenCategoriesSearchSpotlightConfigKey,
  useDynamicConfigValue,
  useIsTokenCategoriesEnabled,
} from '@universe/gating'
import { useMemo } from 'react'
import type { SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { OnchainItemSectionName, type OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { currencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { multichainSearchResultsToOptions } from 'uniswap/src/components/TokenSelector/hooks/useMultichainSearchResultsToOptions'
import { useAllTokenCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useAllTokenCategories'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { dataApiMultichainTokenToSearchResult } from 'uniswap/src/data/apiClients/dataApiService/utils/dataApiMultichainToken'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { MultichainSearchResult } from 'uniswap/src/features/dataApi/types'
import {
  getSpotlitCategorySectionId,
  resolveSpotlitCategories,
} from 'uniswap/src/features/search/SearchModal/categories/spotlitCategories'
import { getTokenCategoryIcon } from 'uniswap/src/features/tokenCategories/categoryIcons'
import { getRwaCategoryForTokenCategory } from 'uniswap/src/features/tokenCategories/rwaCategoryBridge'
import { TokenCategoryClass, type TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

const EMPTY_IDS: string[] = []

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

function toSearchResults(data: ListTokensResponse): MultichainSearchResult[] {
  return data.multichainTokens
    .map((token) => dataApiMultichainTokenToSearchResult(token))
    .filter((r): r is MultichainSearchResult => r !== undefined)
}

// Mirrors the legacy shelves: multichain rows with no network selected, flat single-chain Token rows otherwise
// (the multichain payload still lists every deployment, so the flat rows are narrowed to the selected chain).
function selectMultichainOptions(data: ListTokensResponse): SearchModalOption[] {
  return multichainSearchResultsToOptions(toSearchResults(data)) ?? []
}
function makeSelectFlatOptions(chainId: UniverseChainId): (data: ListTokensResponse) => SearchModalOption[] {
  return (data) =>
    currencyInfosToTokenOptions(
      toSearchResults(data).flatMap((r) => r.tokens.filter((token) => token.currency.chainId === chainId)),
    ) ?? []
}

interface CombinedCategoryQueries {
  options: (SearchModalOption[] | undefined)[]
  /** Any category still on its first load: the pane holds until the whole shelf is in, so rows don't shift as they land. */
  isPending: boolean
  isFetching: boolean
  refetch: () => void
}

function combineCategoryQueries(results: UseQueryResult<SearchModalOption[]>[]): CombinedCategoryQueries {
  return {
    options: results.map((result) => result.data),
    isPending: results.some((result) => result.isPending),
    isFetching: results.some((result) => result.isFetching),
    refetch: (): void => {
      for (const result of results) {
        void result.refetch()
      }
    },
  }
}

export interface SpotlitCategorySectionsResult {
  /** Flag on, at least one configured id resolved, and the shelf is still loading or has rows to show —
   *  once settled empty it flips false so the legacy shelves take the resting state back. */
  enabled: boolean
  sections: OnchainItemSection<SearchModalOption>[]
  isLoading: boolean
  /** First load of any spotlit category, so the pane can hold until the shelf is complete. */
  isInitialLoading: boolean
  refetch: () => void
}

/** One category-filtered ListTokens per spotlit category, in config order; empty categories render no header. */
export function useSpotlitCategorySections({
  chainFilter,
  tokenCount,
  skip,
}: {
  chainFilter: UniverseChainId | null
  tokenCount: number
  skip: boolean
}): SpotlitCategorySectionsResult {
  const tokenCategoriesEnabled = useIsTokenCategoriesEnabled()
  const spotlitCategoryIds = useDynamicConfigValue({
    config: DynamicConfigs.TokenCategoriesSearchSpotlight,
    key: TokenCategoriesSearchSpotlightConfigKey.SpotlitCategoryIds,
    defaultValue: EMPTY_IDS,
    customTypeGuard: isStringArray,
  })
  // Same region gate as the Stocks shelf this replaces, treated as blocked while the region is pending so RWA
  // categories never flash in. Fails closed: the id bridge only knows today's RWA ids, so the whole Asset class
  // (where BE files tokenized equities/commodities) is dropped too.
  const rwaBlocked = useIsFeatureGated(GatedFeature.ISSUER_SPECIFIC_RWA, { pendingValue: true })

  const { categories: allCategories, isLoading: categoriesLoading } = useAllTokenCategories()
  const categories = useMemo(
    () =>
      resolveSpotlitCategories({ spotlitCategoryIds, categories: allCategories }).filter(
        (category) => !rwaBlocked || !isPossiblyRwaCategory(category),
      ),
    [spotlitCategoryIds, allCategories, rwaBlocked],
  )
  const configured = tokenCategoriesEnabled && spotlitCategoryIds.length > 0
  const shelfConfigured = configured && (categoriesLoading || categories.length > 0)
  const fetchEnabled = shelfConfigured && !skip

  const { chains: enabledChainIds } = useEnabledChains()
  const chainIds = useMemo(
    () => (chainFilter === null ? enabledChainIds : [chainFilter]),
    [chainFilter, enabledChainIds],
  )
  const selectOptions = useMemo(
    () => (chainFilter === null ? selectMultichainOptions : makeSelectFlatOptions(chainFilter)),
    [chainFilter],
  )

  const combined = useQueries({
    queries: categories.map((category) => ({
      queryKey: [
        ReactQueryCacheKey.DataApiService,
        'listTokens',
        'spotlitCategory',
        { categoryId: category.id, chainIds, pageSize: tokenCount },
      ],
      queryFn: () =>
        dataApiServiceClientV2.listTokens({
          chainIds,
          page: { pageSize: tokenCount },
          sort: { orderBy: TokensOrderBy.VOLUME_1D, ascending: false },
          // Required by BE — UNSPECIFIED is rejected.
          sparklineDuration: HistoryDuration.DAY,
          filter: { categoryIds: [category.id], applyTopLevelFilters: true },
        }),
      select: selectOptions,
      enabled: fetchEnabled,
      staleTime: ONE_MINUTE_MS,
    })),
    combine: combineCategoryQueries,
  })

  const sections = useMemo(
    () =>
      categories.flatMap((category, index): OnchainItemSection<SearchModalOption>[] => {
        const options = combined.options[index]
        return options?.length ? [buildSpotlitCategorySection({ category, options })] : []
      }),
    [categories, combined.options],
  )

  const isInitialLoading = fetchEnabled && (categoriesLoading || combined.isPending)
  const isLoading = isInitialLoading || combined.isFetching
  // Owns the shelf while resolving/loading so the legacy shelves don't flash in first. Once settled, a shelf with
  // nothing to show (all-stale config, every category empty or failed) hands the resting state back to them —
  // so a failed category never surfaces as an error; it is simply omitted. The legacy queries are gated on
  // `!enabled`, so that fallback is a deliberate second round trip: the anti-flash tradeoff.
  const enabled = shelfConfigured && (isInitialLoading || sections.length > 0)

  return useMemo(
    () => ({
      enabled,
      sections,
      isLoading,
      isInitialLoading,
      refetch: combined.refetch,
    }),
    [enabled, sections, isLoading, isInitialLoading, combined.refetch],
  )
}

function isPossiblyRwaCategory(category: TokenCategory): boolean {
  return (
    getRwaCategoryForTokenCategory(category) !== RwaCategory.UNSPECIFIED ||
    category.categoryClass === TokenCategoryClass.Asset
  )
}

function buildSpotlitCategorySection({
  category,
  options,
}: {
  category: TokenCategory
  options: SearchModalOption[]
}): OnchainItemSection<SearchModalOption> {
  const Icon = getTokenCategoryIcon(category)
  return {
    sectionKey: OnchainItemSectionName.Category,
    sectionId: getSpotlitCategorySectionId(category.id),
    categoryId: category.id,
    name: category.name,
    icon: <Icon color="$neutral2" size="$icon.20" />,
    data: options,
  }
}
