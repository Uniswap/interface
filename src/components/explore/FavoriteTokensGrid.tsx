import { default as React, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { FadeIn } from 'react-native-reanimated'
import { FavoriteHeaderRow } from 'src/components/explore/FavoriteHeaderRow'
import FavoriteTokenCard from 'src/components/explore/FavoriteTokenCard'
import { AnimatedBox, Box, Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { ExploreTokensTabQuery } from 'src/data/__generated__/types-and-hooks'
import { flex } from 'src/styles/flex'
import { theme as FixedTheme } from 'src/styles/theme'

const NUM_COLUMNS = 2
const GAP_SIZE = FixedTheme.spacing.xs
const ITEM_FLEX = { flex: 1 / NUM_COLUMNS }

/** Renders the favorite tokens section on the Explore tab */
export function FavoriteTokensGrid({
  favoriteTokensData,
  isEditing,
  setIsEditing,
  showLoading,
}: {
  favoriteTokensData: ExploreTokensTabQuery['favoriteTokens']
  isEditing: boolean
  setIsEditing: (update: boolean) => void
  showLoading: boolean
}) {
  const { t } = useTranslation()

  // local cache to avoid flicker
  const [localData, setLocalData] = useState<ExploreTokensTabQuery['favoriteTokens'] | undefined>(
    undefined
  )

  useEffect(() => {
    if (favoriteTokensData) {
      setLocalData(favoriteTokensData)
    }
  }, [favoriteTokensData])

  const renderItem = useCallback(
    ({
      item,
      index,
    }: ListRenderItemInfo<NonNullable<ExploreTokensTabQuery['favoriteTokens']>[0]>) => {
      const lastColumn = (index + 1) % NUM_COLUMNS === 0
      return (
        <>
          <FavoriteTokenCard
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            style={ITEM_FLEX}
            token={item}
          />
          {lastColumn ? null : <Box width={GAP_SIZE} />}
        </>
      )
    },
    [isEditing, setIsEditing]
  )

  return (
    <AnimatedBox entering={FadeIn}>
      <FavoriteHeaderRow
        editingTitle={t('Edit favorite tokens')}
        isEditing={isEditing}
        title={t('Favorite tokens')}
        onPress={() => setIsEditing(!isEditing)}
      />
      {!localData || showLoading ? (
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

export function FavoriteTokensGridLoader() {
  return (
    <Flex row gap="xs">
      <Box style={ITEM_FLEX}>
        <Loading height={100} type="favorite" />
      </Box>
      <Box style={ITEM_FLEX}>
        <Loading height={100} type="favorite" />
      </Box>
    </Flex>
  )
}
