import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ScrollView } from 'react-native'
import type { AnimatedRef } from 'react-native-reanimated'
import { FadeIn } from 'react-native-reanimated'
import type { SortableGridDragEndCallback, SortableGridRenderItem } from 'react-native-sortables'
import Sortable from 'react-native-sortables'
import { useDispatch, useSelector } from 'react-redux'
import { FavoriteHeaderRow } from 'src/components/explore/FavoriteHeaderRow'
import { useReportFavoritesSorting } from 'src/components/explore/favoritesSortingStore'
import FavoriteTokenCard from 'src/components/explore/FavoriteTokenCard'
import { useFavoritesDraftOrder } from 'src/components/explore/useFavoritesDraftOrder'
import { getTokenValue } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { Flex } from 'ui/src/components/layout/Flex'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { useCanonicalFavoritesMigration } from 'uniswap/src/features/favorites/hooks/useCanonicalFavoritesMigration'
import { useMultichainFavoritesRankings } from 'uniswap/src/features/favorites/hooks/useMultichainFavoritesRankings'
import { selectFavoriteTokens } from 'uniswap/src/features/favorites/selectors'
import { setFavoriteTokens } from 'uniswap/src/features/favorites/slice'
import { useHapticFeedback } from 'uniswap/src/features/settings/useHapticFeedback/useHapticFeedback'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'

const NUM_COLUMNS = 2
const DEFAULT_TOKENS_TO_DISPLAY = 4

type FavoriteTokensGridProps = {
  showLoading: boolean
  listRef: AnimatedRef<ScrollView>
}

/** Renders the favorite tokens section on the Explore tab */
export function FavoriteTokensGrid({ showLoading, listRef, ...rest }: FavoriteTokensGridProps): JSX.Element | null {
  const { t } = useTranslation()
  const { hapticFeedback } = useHapticFeedback()
  const dispatch = useDispatch()
  // Pull multichain rankings independent of the Explore network filter so badge visibility and the
  // one-time migration see the same cross-chain data regardless of which chain pill is selected.
  const { tokenRankingsData, networkCountByKey } = useMultichainFavoritesRankings()

  useCanonicalFavoritesMigration({ tokenRankingsData })

  const [showAll, setShowAll] = useState(false)
  const favoriteCurrencyIds = useSelector(selectFavoriteTokens)

  const persistFavoriteTokens = useCallback(
    (currencyIds: string[]) => dispatch(setFavoriteTokens({ currencyIds })),
    [dispatch],
  )
  const {
    isEditing,
    orderedItems: orderedCurrencyIds,
    setIsEditing,
    toggleEditing,
    queueDraftOrder,
    settleDraftOrder,
  } = useFavoritesDraftOrder({
    items: favoriteCurrencyIds,
    persist: persistFavoriteTokens,
  })

  const networkCountByKeyRef = useRef(networkCountByKey)
  networkCountByKeyRef.current = networkCountByKey

  useReportFavoritesSorting('tokens', isEditing)

  useEffect(() => {
    if (isEditing) {
      setShowAll(true)
    }
  }, [isEditing])

  const handleDragStart = useCallback(async () => {
    await hapticFeedback.light()
  }, [hapticFeedback])

  const hasMoreTokens = orderedCurrencyIds.length > DEFAULT_TOKENS_TO_DISPLAY
  const visibleTokens =
    showAll || !hasMoreTokens ? orderedCurrencyIds : orderedCurrencyIds.slice(0, DEFAULT_TOKENS_TO_DISPLAY)

  const GRID_GAP = getTokenValue('$spacing8')

  const handleDragEnd = useCallback<SortableGridDragEndCallback<string>>(
    ({ data }) => {
      void hapticFeedback.light()
      queueDraftOrder(data)
    },
    [hapticFeedback, queueDraftOrder],
  )

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item: currencyId }): JSX.Element => {
      const networkCount = networkCountByKeyRef.current.get(normalizeCurrencyIdForMapLookup(currencyId))
      return (
        <FavoriteTokenCard
          showLoading={showLoading}
          currencyId={currencyId}
          isEditing={isEditing}
          networkCount={networkCount}
          setIsEditing={setIsEditing}
        />
      )
    },
    [isEditing, showLoading, setIsEditing],
  )

  return (
    <AnimatedFlex entering={FadeIn}>
      <FavoriteHeaderRow
        disabled={showLoading}
        editingTitle={t('explore.tokens.favorite.title.edit')}
        isEditing={isEditing}
        title={t('explore.tokens.favorite.title.default')}
        onPress={toggleEditing}
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
          onActiveItemDropped={settleDraftOrder}
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
  )
}
