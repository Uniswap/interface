import { default as React, useCallback, useMemo } from 'react'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { FadeIn } from 'react-native-reanimated'
import { useAppSelector } from 'src/app/hooks'
import { FavoriteHeaderRow } from 'src/components/explore/FavoriteHeaderRow'
import FavoriteWalletCard from 'src/components/explore/FavoriteWalletCard'

import { AnimatedFlex, Box } from 'src/components/layout'
import { selectWatchedAddressSet } from 'src/features/favorites/selectors'
import { theme } from 'src/styles/theme'

const NUM_COLUMNS = 2
const GAP_SIZE = theme.spacing.xs
const ITEM_FLEX = 1 / NUM_COLUMNS

/** Renders the favorite tokens card on the Explore page */
export function FavoriteWalletsGrid({
  isEditing,
  setIsEditing,
}: {
  isEditing: boolean
  setIsEditing: (update: boolean) => void
}) {
  const watchedWalletsSet = useAppSelector(selectWatchedAddressSet)
  const watchedWalletsList = useMemo(() => Array.from(watchedWalletsSet), [watchedWalletsSet])

  const renderItem = useCallback(
    ({ item: address, index }: ListRenderItemInfo<string>) => {
      const lastColumn = (index + 1) % NUM_COLUMNS === 0
      return (
        <>
          <FavoriteWalletCard
            address={address}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            style={{ marginVertical: theme.spacing.sm, flex: ITEM_FLEX }}
          />
          {lastColumn ? null : <Box width={GAP_SIZE} />}
        </>
      )
    },
    [isEditing, setIsEditing]
  )

  return (
    <AnimatedFlex entering={FadeIn} gap="none" mx="xs">
      <FavoriteHeaderRow isEditing={isEditing} onPress={() => setIsEditing(!isEditing)} />
      <FlatList
        ItemSeparatorComponent={ItemSeparator}
        data={watchedWalletsList}
        keyExtractor={(address) => address}
        numColumns={NUM_COLUMNS}
        renderItem={renderItem}
      />
    </AnimatedFlex>
  )
}

function ItemSeparator() {
  return <Box width={theme.spacing.xs} />
}
