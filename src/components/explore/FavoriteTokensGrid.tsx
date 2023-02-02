import { default as React, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { FadeIn } from 'react-native-reanimated'
import { useAppSelector } from 'src/app/hooks'
import { FavoriteHeaderRow } from 'src/components/explore/FavoriteHeaderRow'
import FavoriteTokenCard, {
  FAVORITE_TOKEN_CARD_LOADER_HEIGHT,
} from 'src/components/explore/FavoriteTokenCard'
import { AnimatedBox, Box, Flex } from 'src/components/layout'
import { Loader } from 'src/components/loading'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { flex } from 'src/styles/flex'
import { theme as FixedTheme } from 'src/styles/theme'
import { CurrencyId } from 'src/utils/currencyId'

const NUM_COLUMNS = 2
const GAP_SIZE = FixedTheme.spacing.xs
const ITEM_FLEX = { flex: 1 / NUM_COLUMNS }

const renderItemSeparator = (): JSX.Element => <Box height={GAP_SIZE} />

/** Renders the favorite tokens section on the Explore tab */
export function FavoriteTokensGrid({ showLoading }: { showLoading: boolean }): JSX.Element | null {
  const { t } = useTranslation()

  const [isEditing, setIsEditing] = useState(false)
  const favoriteCurrencyIdsSet = useAppSelector(selectFavoriteTokensSet)
  const currencyIds = useMemo(() => Array.from(favoriteCurrencyIdsSet), [favoriteCurrencyIdsSet])

  // Reset edit mode when there are no favorite tokens
  useEffect(() => {
    if (favoriteCurrencyIdsSet.size === 0) {
      setIsEditing(false)
    }
  }, [favoriteCurrencyIdsSet.size])

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<CurrencyId>) => {
      const lastColumn = (index + 1) % NUM_COLUMNS === 0
      return (
        <>
          <FavoriteTokenCard
            currencyId={item}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            style={ITEM_FLEX}
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
        onPress={(): void => setIsEditing(!isEditing)}
      />
      {showLoading ? (
        <FavoriteTokensGridLoader />
      ) : (
        <FlatList
          ItemSeparatorComponent={renderItemSeparator}
          contentContainerStyle={flex.grow}
          data={currencyIds}
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

function FavoriteTokensGridLoader(): JSX.Element {
  return (
    <Flex row gap="xs">
      <Box style={ITEM_FLEX}>
        <Loader.Favorite height={FAVORITE_TOKEN_CARD_LOADER_HEIGHT} />
      </Box>
      <Box style={ITEM_FLEX}>
        <Loader.Favorite height={FAVORITE_TOKEN_CARD_LOADER_HEIGHT} />
      </Box>
    </Flex>
  )
}
