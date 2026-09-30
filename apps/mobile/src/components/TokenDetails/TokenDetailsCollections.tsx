import { SharedEventName } from '@uniswap/analytics-events'
import { Flex, spacing, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { ViewStyle } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { Loader } from 'ui/src'
import { useTokenCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useTokenCategories'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { CATEGORY_PILL_HEIGHT, CategoryPill } from 'uniswap/src/features/tokenCategories/CategoryPill'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { useEvent } from 'utilities/src/react/hooks'

const contentContainerStyle: ViewStyle = {
  gap: spacing.spacing8,
  paddingHorizontal: spacing.spacing16,
}

const keyExtractor = (category: TokenCategory): string => category.id
const SKELETON_PILL_WIDTHS = [88, 104, 96]

/** One tappable pill per category the token belongs to, in canonical order. */
export const TokenDetailsCollections = memo(function TokenDetailsCollections(): JSX.Element | null {
  const { t } = useTranslation()
  const navigation = useAppStackNavigation()
  const { currencyId } = useTokenDetailsContext()
  const { categories, isLoading } = useTokenCategories(currencyId)

  const onPressCategory = useEvent((category: TokenCategory, index: number) => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.TDPCollectionsChip,
      category_id: category.id,
      category_index: index,
    })
    navigation.navigate(MobileScreens.CategoryDetails, { categoryId: category.id })
  })

  // Called during render, so it can't be a useEvent ref.
  const renderItem = useCallback(
    ({ item, index }: { item: TokenCategory; index: number }) => (
      <CollectionPill category={item} index={index} onPress={onPressCategory} />
    ),
    [onPressCategory],
  )

  if (!isLoading && categories.length === 0) {
    return null
  }

  return (
    <Flex gap="$spacing12" testID={TestID.TokenDetailsCollections}>
      <Text color="$neutral2" mx="$spacing16" variant="subheading2">
        {t('explore.collections.title')}
      </Text>
      {categories.length === 0 ? (
        <Flex row gap="$spacing8" px="$spacing16">
          {SKELETON_PILL_WIDTHS.map((width) => (
            <Loader.Box key={width} borderRadius="$roundedFull" height={CATEGORY_PILL_HEIGHT} width={width} />
          ))}
        </Flex>
      ) : (
        <FlatList
          horizontal
          contentContainerStyle={contentContainerStyle}
          data={categories}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
        />
      )}
    </Flex>
  )
})

const CollectionPill = memo(function CollectionPill({
  category,
  index,
  onPress,
}: {
  category: TokenCategory
  index: number
  onPress: (category: TokenCategory, index: number) => void
}): JSX.Element {
  const onPressPill = useEvent(() => onPress(category, index))

  return <CategoryPill category={category} color="$neutral2" onPress={onPressPill} />
})
