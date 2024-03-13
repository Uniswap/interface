import { default as React, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useAppSelector } from 'src/app/hooks'
import { FavoriteHeaderRow } from 'src/components/explore/FavoriteHeaderRow'
import FavoriteWalletCard from 'src/components/explore/FavoriteWalletCard'
import { Loader } from 'src/components/loading'
import {
  AutoScrollProps,
  SortableGrid,
  SortableGridChangeEvent,
  SortableGridRenderItem,
} from 'src/components/sortableGrid'
import { AnimatedFlex, Flex } from 'ui/src'
import { selectWatchedAddressSet } from 'wallet/src/features/favorites/selectors'
import { setFavoriteWallets } from 'wallet/src/features/favorites/slice'
import { useAppDispatch } from 'wallet/src/state'

const NUM_COLUMNS = 2
const ITEM_FLEX = { flex: 1 / NUM_COLUMNS }

type FavoriteWalletsGridProps = AutoScrollProps & {
  showLoading: boolean
}

/** Renders the favorite wallets section on the Explore tab */
export function FavoriteWalletsGrid({
  showLoading,
  ...rest
}: FavoriteWalletsGridProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const [isEditing, setIsEditing] = useState(false)
  const isTokenDragged = useSharedValue(false)
  const watchedWalletsSet = useAppSelector(selectWatchedAddressSet)
  const watchedWalletsList = useMemo(() => Array.from(watchedWalletsSet), [watchedWalletsSet])

  // Reset edit mode when there are no favorite wallets
  useEffect(() => {
    if (watchedWalletsSet.size === 0) {
      setIsEditing(false)
    }
  }, [watchedWalletsSet.size])

  const handleOrderChange = useCallback(
    ({ data }: SortableGridChangeEvent<string>) => {
      dispatch(setFavoriteWallets({ addresses: data }))
    },
    [dispatch]
  )

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item: address, isTouched, dragActivationProgress }): JSX.Element => (
      <FavoriteWalletCard
        key={address}
        address={address}
        dragActivationProgress={dragActivationProgress}
        isEditing={isEditing}
        isTouched={isTouched}
        setIsEditing={setIsEditing}
      />
    ),
    [isEditing]
  )

  const animatedStyle = useAnimatedStyle(() => ({
    zIndex: isTokenDragged.value ? 1 : 0,
  }))

  return (
    <AnimatedFlex entering={FadeIn} style={animatedStyle}>
      <FavoriteHeaderRow
        editingTitle={t('explore.wallets.favorite.title.edit')}
        isEditing={isEditing}
        title={t('explore.wallets.favorite.title.default')}
        onPress={(): void => setIsEditing(!isEditing)}
      />
      {showLoading ? (
        <FavoriteWalletsGridLoader />
      ) : (
        <SortableGrid
          {...rest}
          activeItemOpacity={1}
          data={watchedWalletsList}
          editable={isEditing}
          numColumns={NUM_COLUMNS}
          renderItem={renderItem}
          onChange={handleOrderChange}
          onDragEnd={(): void => {
            isTokenDragged.value = false
          }}
          onDragStart={(): void => {
            isTokenDragged.value = true
          }}
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
