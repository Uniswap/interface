import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import { FavoriteHeaderRow } from 'src/components/explore/FavoriteHeaderRow'
import FavoriteTokenCard, { FAVORITE_TOKEN_CARD_LOADER_HEIGHT } from 'src/components/explore/FavoriteTokenCard'
import { Loader } from 'src/components/loading/loaders'
import { SortableGrid } from 'src/components/sortableGrid/SortableGrid'
import { AutoScrollProps, SortableGridChangeEvent, SortableGridRenderItem } from 'src/components/sortableGrid/types'
import { Flex } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { selectFavoriteTokens } from 'uniswap/src/features/favorites/selectors'
import { setFavoriteTokens } from 'uniswap/src/features/favorites/slice'

const NUM_COLUMNS = 2
const ITEM_FLEX = { flex: 1 / NUM_COLUMNS }

type FavoriteTokensGridProps = AutoScrollProps & {
  showLoading: boolean
}

/** Renders the favorite tokens section on the Explore tab */
export function FavoriteTokensGrid({ showLoading, ...rest }: FavoriteTokensGridProps): JSX.Element | null {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const [isEditing, setIsEditing] = useState(false)
  const isTokenDragged = useSharedValue(false)
  const favoriteCurrencyIds = useSelector(selectFavoriteTokens)

  // Reset edit mode when there are no favorite tokens
  useEffect(() => {
    if (favoriteCurrencyIds.length === 0) {
      setIsEditing(false)
    }
  }, [favoriteCurrencyIds.length])

  const handleOrderChange = useCallback(
    ({ data }: SortableGridChangeEvent<string>) => {
      dispatch(setFavoriteTokens({ currencyIds: data }))
    },
    [dispatch],
  )

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item: currencyId, pressProgress, dragActivationProgress }): JSX.Element => (
      <FavoriteTokenCard
        key={currencyId}
        currencyId={currencyId}
        dragActivationProgress={dragActivationProgress}
        isEditing={isEditing}
        pressProgress={pressProgress}
        setIsEditing={setIsEditing}
      />
    ),
    [isEditing],
  )

  const animatedStyle = useAnimatedStyle(() => ({
    zIndex: isTokenDragged.value ? 1 : 0,
  }))

  return (
    <AnimatedFlex entering={FadeIn} style={animatedStyle}>
      <FavoriteHeaderRow
        disabled={showLoading}
        editingTitle={t('explore.tokens.favorite.title.edit')}
        isEditing={isEditing}
        title={t('explore.tokens.favorite.title.default')}
        onPress={(): void => setIsEditing(!isEditing)}
      />
      {showLoading ? (
        <FavoriteTokensGridLoader />
      ) : (
        <SortableGrid
          {...rest}
          activeItemOpacity={1}
          animateContainerHeight={false}
          data={favoriteCurrencyIds}
          editable={isEditing}
          numColumns={NUM_COLUMNS}
          renderItem={renderItem}
          onChange={handleOrderChange}
          onDragStart={(): void => {
            isTokenDragged.value = true
          }}
          onDrop={(): void => {
            isTokenDragged.value = false
          }}
        />
      )}
    </AnimatedFlex>
  )
}

function FavoriteTokensGridLoader(): JSX.Element {
  return (
    <Flex row>
      <Flex mx="$spacing4" style={ITEM_FLEX}>
        <Loader.Favorite contrast height={FAVORITE_TOKEN_CARD_LOADER_HEIGHT} />
      </Flex>
      <Flex mx="$spacing4" style={ITEM_FLEX}>
        <Loader.Favorite contrast height={FAVORITE_TOKEN_CARD_LOADER_HEIGHT} />
      </Flex>
    </Flex>
  )
}
