import { default as React, useCallback, useMemo } from 'react'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { FadeIn } from 'react-native-reanimated'
import { useAppSelector } from 'src/app/hooks'
import { FavoriteHeaderRow } from 'src/components/explore/FavoriteHeaderRow'
import FavoriteTokenCard from 'src/components/explore/FavoriteTokenCard'

import { AnimatedFlex, Box } from 'src/components/layout'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { flex } from 'src/styles/flex'
import { theme as FixedTheme } from 'src/styles/theme'
import { CurrencyId } from 'src/utils/currencyId'

const NUM_COLUMNS = 3
const GAP_SIZE = FixedTheme.spacing.xs
const ITEM_FLEX = 1 / NUM_COLUMNS

/** Renders the favorite tokens card on the Explore page */
export function FavoriteTokensGrid({
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
          <FavoriteTokenCard
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
      <FavoriteHeaderRow isEditing={isEditing} onPress={() => setIsEditing(!isEditing)} />
      <FlatList
        ItemSeparatorComponent={() => <Box height={GAP_SIZE} />}
        contentContainerStyle={flex.grow}
        data={favoriteCurrencyIds}
        keyExtractor={(item) => item}
        listKey="explore-favorite-tokens"
        numColumns={NUM_COLUMNS}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </AnimatedFlex>
  )
}
