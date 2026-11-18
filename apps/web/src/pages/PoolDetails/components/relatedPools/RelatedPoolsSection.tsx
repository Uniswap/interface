import { SharedEventName } from '@uniswap/analytics-events'
import type { UniverseChainId } from '@universe/chains'
import { useIsPoolCategoriesEnabled } from '@universe/gating'
import { Flex, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { FilterChip, type FilterChipColor } from 'uniswap/src/components/FilterChip/FilterChip'
import type { RelatedPoolCardItem } from 'uniswap/src/data/apiClients/dataApiService/relatedPools/relatedPoolMappers'
import { useRelatedPoolsQuery } from 'uniswap/src/data/apiClients/dataApiService/relatedPools/useRelatedPoolsQuery'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { getCategoryIcon } from 'uniswap/src/features/tokenCategories/categoryIcons'
import type { PoolCategory } from 'uniswap/src/features/tokenCategories/types'
import { getPoolDetailsURL } from 'uniswap/src/utils/linking'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { CAROUSEL_CARD_GAP, CAROUSEL_FADE_WIDTH } from '~/components/TokenCardCarousel/constants'
import { deriveRelatedSectionState, selectRelatedCategory } from '~/components/TokenCardCarousel/relatedSectionState'
import { TokenCardCarousel } from '~/components/TokenCardCarousel/TokenCardCarousel'
import { TokenCardSkeletonRow } from '~/components/TokenCardCarousel/TokenCardSkeleton'
import { useHorizontalSnapCarousel } from '~/components/TokenCardCarousel/useHorizontalSnapCarousel'
import { LoadingBubble } from '~/components/Tokens/loading'
import { edgeFadeMaskStyle, useHorizontalScrollFades } from '~/hooks/useHorizontalScrollFades'
import { PoolCard } from '~/pages/PoolDetails/components/relatedPools/PoolCard'

const CARD_WIDTH = 216
const SKELETON_CARD_COUNT = 4

const getPoolKey = (pool: RelatedPoolCardItem): string => pool.key

/** Other pools in each of this pool's categories; mirrors the TDP related-tokens section. */
export function RelatedPoolsSection({
  categories,
  isLoading: isCategoriesLoading,
  chainId,
  poolId,
}: {
  categories: PoolCategory[]
  /** The pool's category ids are still being hydrated; reserves the slot instead of popping in. */
  isLoading: boolean
  chainId: UniverseChainId
  poolId: string
}): JSX.Element | null {
  const { t } = useTranslation()
  const trace = useTrace()
  const poolCategoriesEnabled = useIsPoolCategoriesEnabled()
  const subject = useMemo(() => ({ chainId, poolId }), [chainId, poolId])

  const [pickedCategoryId, setPickedCategoryId] = useState<string | undefined>()
  const selectedCategoryId = selectRelatedCategory({ categories, pickedCategoryId })?.id
  const { pools, isLoading, isError } = useRelatedPoolsQuery({
    categoryId: selectedCategoryId,
    subject,
    enabled: poolCategoriesEnabled,
  })

  const state = deriveRelatedSectionState({
    categories,
    pickedCategoryId,
    isLoading,
    isError,
    itemCount: pools.length,
    headerTitle: t('pdp.relatedPools.header'),
    singleTitle: (category) => t('pdp.relatedPools.single', { category: category.name }),
  })

  const { scrollerRef: chipsScrollerRef, edgeFades } = useHorizontalScrollFades()

  const onSelectCategory = useEvent((categoryId: string): void => {
    if (categoryId === selectedCategoryId) {
      return
    }
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      ...trace,
      element: ElementName.PDPRelatedPoolsCategoryChip,
      category_id: categoryId,
      category_kind: 'pool',
      pool_address: poolId,
      chain_id: chainId,
      tags_rendered_count: categories.length,
    })
    setPickedCategoryId(categoryId)
  })

  if (!poolCategoriesEnabled) {
    return null
  }

  if (isCategoriesLoading) {
    return <RelatedPoolsSectionSkeleton />
  }

  if (!state) {
    return null
  }

  const { selectedCategory, showChips, isListEmpty, title } = state

  return (
    <Flex gap="$gap16" testID={TestID.PoolDetailsRelatedPools}>
      <Text variant="heading3">{title}</Text>
      {showChips && (
        <Flex
          ref={chipsScrollerRef}
          maxWidth="100%"
          className="scrollbar-hidden"
          $platform-web={{ overflowX: 'auto', overscrollBehaviorX: 'none', ...edgeFadeMaskStyle(edgeFades) }}
        >
          <Flex row alignItems="center" gap="$spacing4">
            {categories.map((category) => (
              <CategoryChip
                key={category.id}
                category={category}
                selected={category.id === selectedCategory.id}
                onSelect={onSelectCategory}
              />
            ))}
          </Flex>
        </Flex>
      )}
      {isListEmpty ? (
        <Text variant="body2" color="$neutral2">
          {isError ? t('explore.pools.error') : t('explore.pools.empty')}
        </Text>
      ) : (
        // Keyed per category so a chip switch starts the new list at its first card.
        <RelatedPoolsCarousel
          key={selectedCategory.id}
          pools={pools}
          isLoading={isLoading}
          categoryId={selectedCategory.id}
        />
      )}
    </Flex>
  )
}

function RelatedPoolsSectionSkeleton(): JSX.Element {
  return (
    <Flex gap="$gap16" testID={TestID.PoolDetailsRelatedPools}>
      <LoadingBubble height={24} width={200} />
      <Flex row gap={CAROUSEL_CARD_GAP} flexWrap="nowrap" overflow="hidden" width="100%">
        <TokenCardSkeletonRow cardWidth={CARD_WIDTH} count={SKELETON_CARD_COUNT} layout="vertical" />
      </Flex>
    </Flex>
  )
}

function RelatedPoolsCarousel({
  pools,
  isLoading,
  categoryId,
}: {
  pools: RelatedPoolCardItem[]
  isLoading: boolean
  categoryId: string
}): JSX.Element {
  const carousel = useHorizontalSnapCarousel({ cardWidth: CARD_WIDTH, itemCount: pools.length, isLoading })

  return (
    <TokenCardCarousel
      items={pools}
      getItemKey={getPoolKey}
      renderItem={(pool) => <RelatedPoolCard pool={pool} categoryId={categoryId} listLength={pools.length} />}
      isLoading={isLoading}
      skeletonCount={SKELETON_CARD_COUNT}
      carousel={carousel}
      cardWidth={CARD_WIDTH}
      fadeWidth={CAROUSEL_FADE_WIDTH}
      showArrowButtons
    />
  )
}

const CategoryChip = memo(function CategoryChip({
  category,
  selected,
  onSelect,
}: {
  category: PoolCategory
  selected: boolean
  onSelect: (categoryId: string) => void
}): JSX.Element {
  const Icon = getCategoryIcon(category)
  const onPress = useEvent(() => onSelect(category.id))
  const renderIcon = useCallback((color: FilterChipColor) => <Icon color={color} size="$icon.16" />, [Icon])

  return <FilterChip active={selected} label={category.name} renderIcon={renderIcon} onPress={onPress} />
})

const RelatedPoolCard = memo(function RelatedPoolCard({
  pool,
  categoryId,
  listLength,
}: {
  pool: RelatedPoolCardItem
  categoryId: string
  listLength: number
}): JSX.Element {
  const navigate = useNavigate()
  const trace = useTrace()

  const onPress = useEvent((): void => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      ...trace,
      element: ElementName.PDPRelatedPoolCard,
      category_id: categoryId,
      category_kind: 'pool',
      pool_address: pool.poolId,
      chain_id: pool.chainId,
      pool_list_length: listLength,
    })
    navigate(getPoolDetailsURL(pool.poolId, pool.chainId))
  })

  return <PoolCard pool={pool} width={CARD_WIDTH} onPress={onPress} />
})
