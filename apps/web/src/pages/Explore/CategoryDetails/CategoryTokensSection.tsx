import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { UniverseChainId } from '@universe/chains'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { Flex, Text } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { getGroupedRwaCategory } from 'uniswap/src/features/tokenCategories/groupedCategory'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { useEvent } from 'utilities/src/react/hooks'
import { NetworkFilter } from '~/components/NetworkFilter/NetworkFilter'
import {
  ExploreTablesFilterStoreContextProvider,
  useExploreTablesFilterStore,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { useListTokens } from '~/features/Explore/state/listTokens/useListTokens'
import { VolumeTimeFrameSelector } from '~/features/Explore/VolumeTimeFrameSelector'
import { showsVolumeTimeFrameSelector } from '~/pages/Explore/categories/exploreGroupedCategory'
import { RwaCategoryTable } from '~/pages/Explore/rwa/table/RwaCategoryTable'
import { SearchBar } from '~/pages/Explore/SearchBar'
import { TokenTable } from '~/pages/Explore/tables/Tokens/TokensTable'
import {
  TokenTableSortStoreContextProvider,
  useTokenTableSortStore,
} from '~/pages/Explore/tables/Tokens/tokenTableSortStore'
import { ExploreTab } from '~/types/explore'

function CategoryTokensTable({
  categoryId,
  chainId,
}: {
  categoryId: string
  chainId: UniverseChainId | undefined
}): JSX.Element {
  const sortMethod = useTokenTableSortStore((s) => s.sortMethod)
  const sortAscending = useTokenTableSortStore((s) => s.sortAscending)
  const filterString = useExploreTablesFilterStore((s) => s.filterString)
  const timePeriod = useExploreTablesFilterStore((s) => s.timePeriod)

  const options = useMemo(
    () => ({ sortMethod, sortAscending, filterString, filterTimePeriod: timePeriod, categoryId }),
    [sortMethod, sortAscending, filterString, timePeriod, categoryId],
  )

  const { topTokens, tokenSortRank, isLoading, sparklines, isError, loadMore } = useListTokens(chainId, options)

  return (
    <TokenTable
      tokens={topTokens}
      tokenSortRank={tokenSortRank}
      sparklines={sparklines}
      loading={isLoading}
      loadMore={loadMore}
      error={isError}
      categoryId={categoryId}
    />
  )
}

function CategoryTable({
  rwaCategory,
  categoryId,
  chainId,
}: {
  rwaCategory: RwaCategory
  categoryId: string
  chainId: UniverseChainId | undefined
}): JSX.Element {
  // Explicit chainScope: this page has no chain URL param, so "All networks" must not fall back to it.
  const chainScope = { chainId }
  if (rwaCategory !== RwaCategory.UNSPECIFIED) {
    // Client-side column sorting is stocks-only, matching the Explore tables.
    return (
      <RwaCategoryTable
        category={rwaCategory}
        enableSorting={rwaCategory === RwaCategory.STOCKS}
        chainScope={chainScope}
      />
    )
  }
  return <CategoryTokensTable categoryId={categoryId} chainId={chainId} />
}

export function CategoryTokensSection({ category }: { category: TokenCategory }): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
  const [chainId, setChainId] = useState<UniverseChainId | undefined>(undefined)
  const onNetworkPress = useEvent((newChainId: UniverseChainId | undefined) => setChainId(newChainId))
  const tokenCount = category.stats?.tokenCount
  const rwaCategory = getGroupedRwaCategory(category)
  const tokenCategoriesEnabled = useIsTokenCategoriesEnabled()
  const showVolumeTimeFrameSelector = showsVolumeTimeFrameSelector({ rwaCategory, tokenCategoriesEnabled })

  return (
    <ExploreTablesFilterStoreContextProvider>
      <TokenTableSortStoreContextProvider>
        <Flex width="100%" gap="$spacing4">
          <Flex
            row
            width="100%"
            alignItems="center"
            justifyContent="space-between"
            gap="$spacing12"
            $md={{ row: false, flexDirection: 'column', alignItems: 'flex-start' }}
          >
            <Text variant="subheading1" color="$neutral1">
              {tokenCount !== undefined && t('categoryDetails.tokenCount', { count: tokenCount })}
            </Text>
            <Flex row gap="$spacing8" alignItems="center" $md={{ width: '100%' }}>
              {showVolumeTimeFrameSelector && <VolumeTimeFrameSelector />}
              <NetworkFilter
                forceAllNetworksLabel
                positionFixed
                position={media.lg ? 'left' : 'right'}
                onPress={onNetworkPress}
                currentChainId={chainId}
                tracePage={InterfacePageName.CategoryDetailsPage}
              />
              <SearchBar tab={ExploreTab.Tokens} />
            </Flex>
          </Flex>
          <CategoryTable rwaCategory={rwaCategory} categoryId={category.id} chainId={chainId} />
        </Flex>
      </TokenTableSortStoreContextProvider>
    </ExploreTablesFilterStoreContextProvider>
  )
}
