import { default as React, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ScrollView } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import type { AnimatedRef } from 'react-native-reanimated'
import { FadeIn } from 'react-native-reanimated'
import type { SortableGridDragEndCallback, SortableGridRenderItem } from 'react-native-sortables'
import Sortable from 'react-native-sortables'
import { useDispatch, useSelector } from 'react-redux'
import { FavoriteHeaderRow } from 'src/components/explore/FavoriteHeaderRow'
import FavoriteWalletCard from 'src/components/explore/FavoriteWalletCard'
import { Loader } from 'src/components/loading/loaders'
import { Flex } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { selectWatchedAddressSet } from 'uniswap/src/features/favorites/selectors'
import { setFavoriteWallets } from 'uniswap/src/features/favorites/slice'

const NUM_COLUMNS = 2
const ITEM_FLEX = { flex: 1 / NUM_COLUMNS }

type FavoriteWalletsGridProps = {
  showLoading: boolean
  listRef: AnimatedRef<FlatList> | AnimatedRef<ScrollView>
}

/** Renders the favorite wallets section on the Explore tab */
export function FavoriteWalletsGrid({ showLoading, listRef, ...rest }: FavoriteWalletsGridProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const [isEditing, setIsEditing] = useState(false)
  const watchedWalletsSet = useSelector(selectWatchedAddressSet)
  const watchedWalletsList = useMemo(() => Array.from(watchedWalletsSet), [watchedWalletsSet])

  // Reset edit mode when there are no favorite wallets
  useEffect(() => {
    if (watchedWalletsSet.size === 0) {
      setIsEditing(false)
    }
  }, [watchedWalletsSet.size])

  const handleDragEnd = useCallback<SortableGridDragEndCallback<string>>(
    ({ data }) => {
      dispatch(setFavoriteWallets({ addresses: data }))
    },
    [dispatch],
  )

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item: address }): JSX.Element => (
      <FavoriteWalletCard address={address} isEditing={isEditing} setIsEditing={setIsEditing} />
    ),
    [isEditing],
  )

  return (
    <Sortable.Layer>
      <AnimatedFlex entering={FadeIn}>
        <FavoriteHeaderRow
          editingTitle={t('explore.wallets.favorite.title.edit')}
          isEditing={isEditing}
          title={t('explore.wallets.favorite.title.default')}
          disabled={showLoading}
          onPress={(): void => setIsEditing(!isEditing)}
        />
        {showLoading ? (
          <FavoriteWalletsGridLoader />
        ) : (
          <Sortable.Grid
            {...rest}
            scrollableRef={listRef}
            autoScrollActivationOffset={[75, 100]}
            data={watchedWalletsList}
            sortEnabled={isEditing}
            columns={NUM_COLUMNS}
            renderItem={renderItem}
            onDragEnd={handleDragEnd}
          />
        )}
      </AnimatedFlex>
    </Sortable.Layer>
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
