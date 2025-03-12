import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native-gesture-handler'
import { AnimatedRef, FadeIn } from 'react-native-reanimated'
import type { SortableGridDragEndCallback, SortableGridRenderItem } from 'react-native-sortables'
import Sortable from 'react-native-sortables'
import { useDispatch, useSelector } from 'react-redux'
import { FavoriteHeaderRow } from 'src/components/explore/FavoriteHeaderRow'
import FavoriteTokenCard from 'src/components/explore/FavoriteTokenCard'
import { getTokenValue } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { selectFavoriteTokens } from 'uniswap/src/features/favorites/selectors'
import { setFavoriteTokens } from 'uniswap/src/features/favorites/slice'

const NUM_COLUMNS = 2

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
    ({ item: currencyId }): JSX.Element => {
      return (
        <FavoriteTokenCard
          showLoading={showLoading}
          currencyId={currencyId}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
        />
      )
    },
    [isEditing, showLoading],
  )

  const GRID_GAP = getTokenValue('$spacing8')
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
        <Sortable.Grid
          {...rest}
          animateHeight
          scrollableRef={listRef}
          data={favoriteCurrencyIds}
          sortEnabled={isEditing}
          autoScrollActivationOffset={[75, 100]}
          columns={NUM_COLUMNS}
          renderItem={renderItem}
          rowGap={GRID_GAP}
          columnGap={GRID_GAP}
          onDragEnd={handleDragEnd}
        />
      </AnimatedFlex>
    </Sortable.Layer>
  )
}
