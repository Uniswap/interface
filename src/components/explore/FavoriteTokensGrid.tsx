import { default as React, useCallback, useEffect, useState } from 'react'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { FadeIn } from 'react-native-reanimated'
import { useAppSelector } from 'src/app/hooks'
import { FavoriteHeaderRow } from 'src/components/explore/FavoriteHeaderRow'
import FavoriteTokenCard from 'src/components/explore/FavoriteTokenCard'
import { AnimatedBox, Box } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { ExploreTokensTabQuery } from 'src/data/__generated__/types-and-hooks'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { flex } from 'src/styles/flex'
import { theme as FixedTheme } from 'src/styles/theme'

const NUM_COLUMNS = 3
const GAP_SIZE = FixedTheme.spacing.xs
const ITEM_FLEX = { flex: 1 / NUM_COLUMNS }

/** Renders the favorite tokens card on the Explore page */
export function FavoriteTokensGrid({
  favoriteTokensData,
  isEditing,
  setIsEditing,
}: {
  favoriteTokensData: ExploreTokensTabQuery['favoriteTokensData']
  isEditing: boolean
  setIsEditing: (update: boolean) => void
}) {
  // local cache to avoid flicker
  const [localData, setLocalData] = useState<
    ExploreTokensTabQuery['favoriteTokensData'] | undefined
  >(undefined)

  useEffect(() => {
    if (favoriteTokensData) {
      setLocalData(favoriteTokensData)
    }
  }, [favoriteTokensData])

  const renderItem = useCallback(
    ({
      item,
      index,
    }: ListRenderItemInfo<NonNullable<ExploreTokensTabQuery['favoriteTokensData']>[0]>) => {
      const lastColumn = (index + 1) % NUM_COLUMNS === 0
      return (
        <>
          <FavoriteTokenCard
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            style={ITEM_FLEX}
            tokenData={item}
          />
          {lastColumn ? null : <Box width={GAP_SIZE} />}
        </>
      )
    },
    [isEditing, setIsEditing]
  )

  return (
    <AnimatedBox entering={FadeIn}>
      <FavoriteHeaderRow isEditing={isEditing} onPress={() => setIsEditing(!isEditing)} />
      {!localData ? (
        <FavoriteTokensGridLoader />
      ) : (
        <FlatList
          ItemSeparatorComponent={() => <Box height={GAP_SIZE} />}
          contentContainerStyle={flex.grow}
          data={localData}
          listKey="explore-favorite-tokens"
          numColumns={NUM_COLUMNS}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />
      )}
    </AnimatedBox>
  )
}

// Mimic the layout to avoid thrashing.
export function FavoriteTokensGridLoader() {
  const favoriteCurrencyIdsSet = useAppSelector(selectFavoriteTokensSet)
  const loadingData = Array.from(favoriteCurrencyIdsSet)
  const renderItem = useCallback(({ index }: ListRenderItemInfo<string>) => {
    const lastColumn = (index + 1) % NUM_COLUMNS === 0
    return (
      <>
        <Box aspectRatio={1} style={ITEM_FLEX}>
          <Loading type="favorite" />
        </Box>
        {lastColumn ? null : <Box width={GAP_SIZE} />}
      </>
    )
  }, [])

  return (
    <FlatList
      ItemSeparatorComponent={() => <Box height={GAP_SIZE} />}
      contentContainerStyle={flex.grow}
      data={loadingData}
      listKey="explore-favorite-tokens"
      numColumns={NUM_COLUMNS}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    />
  )
}
