import { AnimatedFlex, Flex } from '@universe/mycelium'
import { default as React, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ScrollView } from 'react-native'
import type { AnimatedRef } from 'react-native-reanimated'
import { FadeIn } from 'react-native-reanimated'
import type { SortableGridDragEndCallback, SortableGridRenderItem } from 'react-native-sortables'
import Sortable from 'react-native-sortables'
import { useDispatch, useSelector } from 'react-redux'
import { FavoriteHeaderRow } from 'src/components/explore/FavoriteHeaderRow'
import { useFavoritesDragScrollLock } from 'src/components/explore/favoritesSortingStore'
import FavoriteWalletCard from 'src/components/explore/FavoriteWalletCard'
import { useFavoritesDraftOrder } from 'src/components/explore/useFavoritesDraftOrder'
import { Loader } from 'src/components/loading/loaders'
import { selectWatchedAddressSet } from 'uniswap/src/features/favorites/selectors'
import { setFavoriteWallets } from 'uniswap/src/features/favorites/slice'

const NUM_COLUMNS = 2
const ITEM_FLEX = { flex: 1 / NUM_COLUMNS }

type FavoriteWalletsGridProps = {
  showLoading: boolean
  listRef: AnimatedRef<ScrollView>
}

/** Renders the favorite wallets section on the Explore tab */
export function FavoriteWalletsGrid({ showLoading, listRef, ...rest }: FavoriteWalletsGridProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const watchedWalletsSet = useSelector(selectWatchedAddressSet)
  const watchedWalletsList = useMemo(() => Array.from(watchedWalletsSet), [watchedWalletsSet])

  const persistFavoriteWallets = useCallback(
    (addresses: string[]) => dispatch(setFavoriteWallets({ addresses })),
    [dispatch],
  )
  const {
    isEditing,
    orderedItems: orderedWalletsList,
    setIsEditing,
    toggleEditing,
    queueDraftOrder,
    settleDraftOrder,
  } = useFavoritesDraftOrder({
    items: watchedWalletsList,
    persist: persistFavoriteWallets,
  })

  const { onDragStart: lockListScroll, onDragEnd: unlockListScroll } = useFavoritesDragScrollLock('wallets')

  const handleDragEnd = useCallback<SortableGridDragEndCallback<string>>(
    ({ data }) => {
      unlockListScroll()
      queueDraftOrder(data)
    },
    [queueDraftOrder, unlockListScroll],
  )

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item: address }): JSX.Element => (
      <FavoriteWalletCard address={address} isEditing={isEditing} setIsEditing={setIsEditing} />
    ),
    [isEditing, setIsEditing],
  )

  return (
    <AnimatedFlex entering={FadeIn}>
      <FavoriteHeaderRow
        editingTitle={t('explore.wallets.favorite.title.edit')}
        isEditing={isEditing}
        title={t('explore.wallets.favorite.title.default')}
        disabled={showLoading}
        onPress={toggleEditing}
      />
      {showLoading ? (
        <FavoriteWalletsGridLoader />
      ) : (
        <Sortable.Grid
          {...rest}
          scrollableRef={listRef}
          autoScrollActivationOffset={[75, 100]}
          data={orderedWalletsList}
          sortEnabled={isEditing}
          columns={NUM_COLUMNS}
          renderItem={renderItem}
          onDragEnd={handleDragEnd}
          onDragStart={lockListScroll}
          onActiveItemDropped={settleDraftOrder}
        />
      )}
    </AnimatedFlex>
  )
}

function FavoriteWalletsGridLoader(): JSX.Element {
  return (
    <Flex row gap="$spacing8">
      <Flex style={ITEM_FLEX}>
        <Loader.Favorite contrast height={48} />
      </Flex>
      <Flex style={ITEM_FLEX}>
        <Loader.Favorite contrast height={48} />
      </Flex>
    </Flex>
  )
}
