import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ScrollView } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import type { AnimatedRef } from 'react-native-reanimated'
import { FadeIn } from 'react-native-reanimated'
import type { SortableGridDragEndCallback, SortableGridRenderItem } from 'react-native-sortables'
import Sortable from 'react-native-sortables'
import { useDispatch, useSelector } from 'react-redux'
import { FavoriteHeaderRow } from 'src/components/explore/FavoriteHeaderRow'
import FavoriteTokenCard from 'src/components/explore/FavoriteTokenCard'
import { getTokenValue } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { Flex } from 'ui/src/components/layout/Flex'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { selectFavoriteTokens } from 'uniswap/src/features/favorites/selectors'
import { setFavoriteTokens } from 'uniswap/src/features/favorites/slice'
import { useHapticFeedback } from 'uniswap/src/features/settings/useHapticFeedback/useHapticFeedback'

const NUM_COLUMNS = 2
const DEFAULT_TOKENS_TO_DISPLAY = 4

type FavoriteTokensGridProps = {
  showLoading: boolean
  listRef: AnimatedRef<FlatList> | AnimatedRef<ScrollView>
}

/** Renders the favorite tokens section on the Explore tab */
export function FavoriteTokensGrid({ showLoading, listRef, ...rest }: FavoriteTokensGridProps): JSX.Element | null {
  const { t } = useTranslation()
  const { hapticFeedback } = useHapticFeedback()
  const dispatch = useDispatch()

  const [isEditing, setIsEditing] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const favoriteCurrencyIds = useSelector(selectFavoriteTokens)

  // Reset edit mode when there are no favorite tokens
  useEffect(() => {
    if (favoriteCurrencyIds.length === 0) {
      setIsEditing(false)
    }
  }, [favoriteCurrencyIds.length])

  // Automatically expand when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setShowAll(true)
    }
  }, [isEditing])

  const handleDragStart = useCallback(async () => {
    await hapticFeedback.light()
  }, [hapticFeedback])

  const hasMoreTokens = favoriteCurrencyIds.length > DEFAULT_TOKENS_TO_DISPLAY
  const visibleTokens =
    showAll || !hasMoreTokens ? favoriteCurrencyIds : favoriteCurrencyIds.slice(0, DEFAULT_TOKENS_TO_DISPLAY)

  const GRID_GAP = getTokenValue('$spacing8')

  const handleDragEnd = useCallback<SortableGridDragEndCallback<string>>(
    async ({ data }) => {
      await hapticFeedback.light()
      if (showAll || !hasMoreTokens) {
        dispatch(setFavoriteTokens({ currencyIds: data }))
      } else {
        // merge reordered visible tokens with hidden ones
        const hiddenTokens = favoriteCurrencyIds.slice(DEFAULT_TOKENS_TO_DISPLAY)
        dispatch(setFavoriteTokens({ currencyIds: [...data, ...hiddenTokens] }))
      }
    },
    [hapticFeedback, dispatch, showAll, favoriteCurrencyIds, hasMoreTokens],
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

        <Flex>
          <Sortable.Grid
            {...rest}
            scrollableRef={listRef}
            data={visibleTokens}
            sortEnabled={isEditing}
            autoScrollActivationOffset={[75, 100]}
            columns={NUM_COLUMNS}
            renderItem={renderItem}
            rowGap={GRID_GAP}
            columnGap={GRID_GAP}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
          />
          {hasMoreTokens && (
            <ExpandoRow
              isExpanded={showAll}
              label={showAll ? t('common.showLess.button') : t('common.showMore.button')}
              mx="$spacing16"
              onPress={(): void => setShowAll((value: boolean) => !value)}
            />
          )}
        </Flex>
      </AnimatedFlex>
    </Sortable.Layer>
  )
}
