import { default as React, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { FadeIn } from 'react-native-reanimated'
import { useAppSelector } from 'src/app/hooks'
import { PinnedHeaderRow } from 'src/components/explore/PinnedHeaderRow'
import PinnedTokenCard from 'src/components/explore/PinnedTokenCard'
import { AnimatedFlex, Box } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { flex } from 'src/styles/flex'
import { theme as FixedTheme } from 'src/styles/theme'
import { CurrencyId } from 'src/utils/currencyId'

const NUM_COLUMNS = 3
const GAP_SIZE = FixedTheme.spacing.xs
const ITEM_FLEX = 1 / NUM_COLUMNS

/** Renders the favorite tokens card on the Explore page */
export function PinnedTokensGrid({
  isEditing,
  setIsEditing,
}: {
  isEditing: boolean
  setIsEditing: (update: boolean) => void
}) {
  const favoriteCurrencyIdsSet = useAppSelector(selectFavoriteTokensSet)
  const favoriteCurrencyIds = useMemo(
    () => Array.from(favoriteCurrencyIdsSet),
    [favoriteCurrencyIdsSet]
  )

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<CurrencyId>) => {
      const lastColumn = (index + 1) % NUM_COLUMNS === 0
      return (
        <>
          <PinnedTokenCard
            currencyId={item}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            style={{ flex: ITEM_FLEX }}
          />
          {lastColumn ? null : <Box width={GAP_SIZE} />}
        </>
      )
    },
    [isEditing, setIsEditing]
  )

  return (
    <AnimatedFlex entering={FadeIn} gap="sm" mx="xs">
      <PinnedHeaderRow isEditing={isEditing} onPress={() => setIsEditing(!isEditing)} />
      <FlatList
        ItemSeparatorComponent={() => <Box height={GAP_SIZE} />}
        ListEmptyComponent={FavoritesEmptyState}
        contentContainerStyle={{ ...flex.grow }}
        data={favoriteCurrencyIds}
        keyExtractor={(item) => item}
        listKey="explore-pinned-tokens"
        numColumns={NUM_COLUMNS}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </AnimatedFlex>
  )
}

export function FavoritesEmptyState() {
  const { t } = useTranslation()
  return <BaseCard.EmptyState description={t('Pin tokens to monitor their prices.')} />
}
