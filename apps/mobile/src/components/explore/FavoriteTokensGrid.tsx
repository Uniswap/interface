import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native-gesture-handler'
import { AnimatedRef, FadeIn } from 'react-native-reanimated'
import type { SortableGridDragEndCallback, SortableGridRenderItem } from 'react-native-sortables'
import Sortable from 'react-native-sortables'
import { useDispatch, useSelector } from 'react-redux'
import { FavoriteHeaderRow } from 'src/components/explore/FavoriteHeaderRow'
import FavoriteTokenCard, { FAVORITE_TOKEN_CARD_LOADER_HEIGHT } from 'src/components/explore/FavoriteTokenCard'
import { Loader } from 'src/components/loading/loaders'
import { Flex } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { selectFavoriteTokens } from 'uniswap/src/features/favorites/selectors'
import { setFavoriteTokens } from 'uniswap/src/features/favorites/slice'

const NUM_COLUMNS = 2
const ITEM_FLEX = { flex: 1 / NUM_COLUMNS }

type FavoriteTokensGridProps = {
  showLoading: boolean
  listRef: AnimatedRef<FlatList>
}

/** Renders the favorite tokens section on the Explore tab */
export function FavoriteTokensGrid({ showLoading, listRef, ...rest }: FavoriteTokensGridProps): JSX.Element | null {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const [isEditing, setIsEditing] = useState(false)
  const favoriteCurrencyIds = useSelector(selectFavoriteTokens)

  // Reset edit mode when there are no favorite tokens
  useEffect(() => {
    if (favoriteCurrencyIds.length === 0) {
      setIsEditing(false)
    }
  }, [favoriteCurrencyIds.length])

  const handleDragEnd = useCallback<SortableGridDragEndCallback<string>>(
    ({ data }) => {
      dispatch(setFavoriteTokens({ currencyIds: data }))
    },
    [dispatch],
  )

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item: currencyId }): JSX.Element => (
      <FavoriteTokenCard currencyId={currencyId} isEditing={isEditing} setIsEditing={setIsEditing} />
    ),
    [isEditing],
  )

  return (
    <Sortable.Layer>
      <AnimatedFlex entering={FadeIn}>
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
          <Sortable.Grid
            {...rest}
            animateHeight
            scrollableRef={listRef}
            data={favoriteCurrencyIds}
            sortEnabled={isEditing}
            autoScrollActivationOffset={[75, 100]}
            columns={NUM_COLUMNS}
            renderItem={renderItem}
            onDragEnd={handleDragEnd}
          />
        )}
      </AnimatedFlex>
    </Sortable.Layer>
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
