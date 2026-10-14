import { SharedEventName } from '@uniswap/analytics-events'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import {
  Flex,
  Loader,
  Text,
  TouchableArea,
  UniversalList,
  type UniversalListRenderItemInfo,
  type UniversalListStyle,
} from '@universe/mycelium'
import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useWindowDimensions } from 'react-native'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { fonts, iconSizes, spacing } from 'ui/src/theme'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { useListCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListCategoriesQuery'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { bucketTokenCategories } from 'uniswap/src/features/tokenCategories/bucketTokenCategories'
import { getTokenCategoryIcon } from 'uniswap/src/features/tokenCategories/categoryIcons'
import { getCategoryPileLogos } from 'uniswap/src/features/tokenCategories/getCategoryPileLogos'
import { getTokenCategoryClassLabel } from 'uniswap/src/features/tokenCategories/getTokenCategoryClassLabel'
import { TokenLogoPile } from 'uniswap/src/features/tokenCategories/TokenLogoPile'
import { TokenCategory, TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'
import { useTokenCategoryOrder } from 'uniswap/src/features/tokenCategories/useTokenCategoryOrder'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

// `getFixedItemSize` force-sizes cells, so these must match the rendered layouts exactly.
const CATEGORY_ROW_HEIGHT = 64
const BUCKET_HEADER_HEIGHT = 44
const ICON_TILE_SIZE = 40
const PILE_LOGO_SIZE = iconSizes.icon24

const EMPTY_CATEGORIES: TokenCategory[] = []

type CollectionsListItem =
  | { rowType: 'header'; key: string; categoryClass: TokenCategoryClass }
  | { rowType: 'category'; key: string; category: TokenCategory }
  | { rowType: 'skeleton-header'; key: string }
  | { rowType: 'skeleton'; key: string }

const SKELETON_ITEMS: CollectionsListItem[] = [
  { rowType: 'skeleton-header', key: 'skeleton-header' },
  ...Array.from({ length: 8 }, (_, i): CollectionsListItem => ({ rowType: 'skeleton', key: `skeleton-${i}` })),
]

function useBucketLabel(): (categoryClass: TokenCategoryClass) => string {
  const { t } = useTranslation()
  return useEvent((categoryClass: TokenCategoryClass): string => getTokenCategoryClassLabel(categoryClass, t))
}

const CategoryRow = memo(function CategoryRow({
  category,
  onPress,
}: {
  category: TokenCategory
  onPress: (category: TokenCategory) => void
}): JSX.Element {
  const { t } = useTranslation()
  const Icon = getTokenCategoryIcon(category)
  const stats = category.stats

  const onRowPress = useEvent(() => {
    onPress(category)
  })

  return (
    <TouchableArea onPress={onRowPress}>
      <Flex row alignItems="center" gap="$spacing12" height={CATEGORY_ROW_HEIGHT} px="$spacing16">
        <Flex
          centered
          backgroundColor="$accent2"
          borderRadius="$rounded12"
          height={ICON_TILE_SIZE}
          width={ICON_TILE_SIZE}
        >
          <Icon color="$accent1" size="$icon.20" />
        </Flex>
        <Flex grow shrink gap="$spacing2">
          <Text numberOfLines={1} variant="subheading2">
            {category.name}
          </Text>
          {stats && (
            <Flex row alignItems="center" gap="$spacing6">
              <RelativeChange arrowSize="$icon.12" change={stats.priceChange24hPct} variant="body3" />
              <Text color="$neutral3" variant="body3">
                {t('categoryDetails.tokenCount', { count: stats.tokenCount })}
              </Text>
            </Flex>
          )}
        </Flex>
        <TokenLogoPile logos={getCategoryPileLogos(category)} size={PILE_LOGO_SIZE} />
      </Flex>
    </TouchableArea>
  )
})

function CategoryRowSkeleton(): JSX.Element {
  return (
    <Flex row alignItems="center" gap="$spacing12" height={CATEGORY_ROW_HEIGHT} px="$spacing16">
      <Loader.Box borderRadius="$rounded12" height={ICON_TILE_SIZE} width={ICON_TILE_SIZE} />
      <Flex grow gap="$spacing6">
        <Loader.Box borderRadius="$rounded8" height={18} width={140} />
        <Loader.Box borderRadius="$rounded8" height={14} width={100} />
      </Flex>
      <Loader.Box borderRadius="$roundedFull" height={PILE_LOGO_SIZE} width={PILE_LOGO_SIZE * 2} />
    </Flex>
  )
}

export function CollectionsScreen(): JSX.Element {
  const tokenCategoriesEnabled = useIsTokenCategoriesEnabled()
  const { data: categories, isFetching, error, refetch } = useListCategoriesQuery()
  const orderedCategories = useTokenCategoryOrder(categories ?? EMPTY_CATEGORIES)

  return (
    <Trace directFromPage logImpression screen={MobileScreens.Collections}>
      <CollectionsContent
        // isFetching (not isLoading) so the Retry tap swaps the error card back to the
        // skeleton — a failed query isn't pending, so isLoading stays false on refetch.
        {...(tokenCategoriesEnabled
          ? { error: error !== null && !isFetching, isLoading: isFetching && !categories?.length, orderedCategories }
          : { error: false, isLoading: false, orderedCategories: EMPTY_CATEGORIES })}
        onRetry={refetch}
      />
    </Trace>
  )
}

function CollectionsContent({
  orderedCategories,
  isLoading,
  error,
  onRetry,
}: {
  orderedCategories: TokenCategory[]
  isLoading: boolean
  error: boolean
  onRetry: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const insets = useAppInsets()
  const dimensions = useWindowDimensions()
  const navigation = useExploreStackNavigation()
  const trace = useTrace()
  const getBucketLabel = useBucketLabel()

  const buckets = useMemo(() => bucketTokenCategories(orderedCategories), [orderedCategories])
  const categoryIndexById = useMemo(
    () => new Map(buckets.flatMap((bucket) => bucket.categories).map((category, index) => [category.id, index])),
    [buckets],
  )

  const onCategoryPress = useEvent((category: TokenCategory) => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      ...trace,
      element: ElementName.CollectionsCategoryRow,
      category_id: category.id,
      category_index: categoryIndexById.get(category.id),
    })
    navigation.navigate(MobileScreens.CategoryDetails, { categoryId: category.id })
  })

  const listData: CollectionsListItem[] = useMemo(() => {
    if (isLoading) {
      return SKELETON_ITEMS
    }
    return buckets.flatMap((bucket): CollectionsListItem[] => [
      { rowType: 'header', key: `header-${bucket.categoryClass}`, categoryClass: bucket.categoryClass },
      ...bucket.categories.map(
        (category): CollectionsListItem => ({ rowType: 'category', key: category.id, category }),
      ),
    ])
  }, [isLoading, buckets])

  const listEmptyComponent = useMemo(() => {
    if (isLoading) {
      return null
    }
    return (
      <Flex centered pt="$spacing48" px="$spacing36">
        {error ? (
          <BaseCard.ErrorState
            retryButtonLabel={t('common.button.retry')}
            title={t('explore.tokens.error')}
            onRetry={onRetry}
          />
        ) : (
          <BaseCard.EmptyState description={t('explore.collections.empty')} />
        )}
      </Flex>
    )
  }, [isLoading, error, onRetry, t])

  const renderItem = useCallback(
    ({ item }: UniversalListRenderItemInfo<CollectionsListItem>): JSX.Element => {
      if (item.rowType === 'skeleton') {
        return <CategoryRowSkeleton />
      }
      if (item.rowType === 'skeleton-header') {
        return (
          <Flex justifyContent="flex-end" height={BUCKET_HEADER_HEIGHT} pb="$spacing8" px="$spacing16">
            <Loader.Box borderRadius="$rounded8" height={fonts.body2.lineHeight} width={80} />
          </Flex>
        )
      }
      if (item.rowType === 'header') {
        return (
          <Flex justifyContent="flex-end" height={BUCKET_HEADER_HEIGHT} pb="$spacing8" px="$spacing16">
            <Text color="$neutral2" variant="body2">
              {getBucketLabel(item.categoryClass)}
            </Text>
          </Flex>
        )
      }
      return <CategoryRow category={item.category} onPress={onCategoryPress} />
    },
    [getBucketLabel, onCategoryPress],
  )

  const contentContainerStyle = useMemo<UniversalListStyle>(
    () => ({ style: { paddingBottom: insets.bottom + spacing.spacing32 } }),
    [insets.bottom],
  )

  const keyExtractor = useCallback((item: CollectionsListItem): string => item.key, [])
  const getItemType = useCallback((item: CollectionsListItem): string => item.rowType, [])
  const getItemSize = useCallback(
    (item: CollectionsListItem): number =>
      item.rowType === 'header' || item.rowType === 'skeleton-header' ? BUCKET_HEADER_HEIGHT : CATEGORY_ROW_HEIGHT,
    [],
  )

  return (
    <Screen edges={['top', 'left', 'right']}>
      <BackHeader px="$spacing16" py="$spacing12">
        <Text variant="body1">{t('explore.collections.title')}</Text>
      </BackHeader>
      <UniversalList
        recycleItems
        contentContainerStyle={contentContainerStyle}
        data={listData}
        estimatedItemSize={CATEGORY_ROW_HEIGHT}
        estimatedListSize={dimensions}
        getFixedItemSize={getItemSize}
        getItemType={getItemType}
        keyExtractor={keyExtractor}
        ListEmptyComponent={listEmptyComponent}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  )
}
