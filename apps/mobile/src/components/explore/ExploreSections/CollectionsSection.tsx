import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { Flex, spacing, Text } from '@universe/mycelium'
import { ArrowRight } from '@universe/mycelium/icons/ArrowRight'
import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ViewStyle } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { ExploreSectionHeader } from 'src/components/explore/ExploreSections/ExploreSectionHeader'
import { Loader } from 'ui/src'
import { useListCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListCategoriesQuery'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { CATEGORY_PILL_HEIGHT, CategoryPill, Pill } from 'uniswap/src/features/tokenCategories/CategoryPill'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { useTokenCategoryOrder } from 'uniswap/src/features/tokenCategories/useTokenCategoryOrder'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

const EMPTY_CATEGORIES: TokenCategory[] = []

const keyExtractor = (category: TokenCategory): string => category.id

const contentContainerStyle: ViewStyle = {
  alignItems: 'center',
  gap: spacing.spacing8,
  paddingHorizontal: spacing.spacing16,
}

const SKELETON_PILL_WIDTHS = [96, 112, 88, 104]

function ViewAllPill({ onPress }: { onPress: () => void }): JSX.Element {
  const { t } = useTranslation()

  return (
    <Pill gap="$spacing8" onPress={onPress}>
      <Text variant="buttonLabel3">{t('common.viewAll')}</Text>
      <ArrowRight color="$neutral1" size="$icon.16" />
    </Pill>
  )
}

/** Horizontally scrolling category pills in the Collections section on mobile Explore. */
export const CollectionsSection = memo(function CollectionsSection(): JSX.Element | null {
  const { t } = useTranslation()
  const navigation = useExploreStackNavigation()
  const tokenCategoriesEnabled = useIsTokenCategoriesEnabled()
  const { data: categories, isLoading } = useListCategoriesQuery()
  const orderedCategories = useTokenCategoryOrder(categories ?? EMPTY_CATEGORIES)

  const onViewAllPress = useCallback(() => {
    sendAnalyticsEvent(MobileEventName.ExploreCollectionsViewAllSelected)
    navigation.navigate(MobileScreens.Collections)
  }, [navigation])

  const header = <ExploreSectionHeader title={t('explore.collections.title')} onPress={onViewAllPress} />

  const renderItem = useCallback(
    ({ item, index }: { item: TokenCategory; index: number }) => (
      <CategoryPill
        category={item}
        onPress={() => {
          sendAnalyticsEvent(MobileEventName.ExploreCategoryPillSelected, { category_id: item.id, position: index })
          navigation.navigate(MobileScreens.CategoryDetails, { categoryId: item.id })
        }}
      />
    ),
    [navigation],
  )

  if (!tokenCategoriesEnabled) {
    return null
  }

  // Reserve the section's space during the initial fetch so it doesn't push content down post-paint.
  if (isLoading && orderedCategories.length === 0) {
    return (
      <Flex gap="$spacing12">
        {header}
        <Flex row alignItems="center" gap="$spacing8" px="$spacing16">
          {SKELETON_PILL_WIDTHS.map((width) => (
            <Loader.Box key={width} borderRadius="$roundedFull" height={CATEGORY_PILL_HEIGHT} width={width} />
          ))}
        </Flex>
      </Flex>
    )
  }

  if (orderedCategories.length === 0) {
    return null
  }

  return (
    <Flex gap="$spacing12">
      {header}
      <FlatList
        horizontal
        contentContainerStyle={contentContainerStyle}
        data={orderedCategories}
        keyExtractor={keyExtractor}
        ListFooterComponent={<ViewAllPill onPress={onViewAllPress} />}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
      />
    </Flex>
  )
})
