import { default as React, useCallback, useMemo } from 'react'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { FadeIn } from 'react-native-reanimated'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { useEagerUserProfileNavigation } from 'src/app/navigation/hooks'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { FavoriteHeaderRow } from 'src/components/explore/FavoriteHeaderRow'
import RemoveButton from 'src/components/explore/RemoveButton'

import { AnimatedFlex, Box } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { selectWatchedAddressSet } from 'src/features/favorites/selectors'
import { removeWatchedAddress } from 'src/features/favorites/slice'
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
  const dispatch = useAppDispatch()
  const { preload, navigate } = useEagerUserProfileNavigation()
  const watchedWalletsSet = useAppSelector(selectWatchedAddressSet)
  const watchedWalletsList = useMemo(() => Array.from(watchedWalletsSet), [watchedWalletsSet])

  const onRemove = useCallback(
    (address: string) => dispatch(removeWatchedAddress({ address })),
    [dispatch]
  )

  const renderItem = useCallback(
    ({ item: address, index }: ListRenderItemInfo<string>) => {
      const lastColumn = (index + 1) % NUM_COLUMNS === 0
      return (
        <>
          <Button
            style={{ marginVertical: theme.spacing.sm, flex: ITEM_FLEX }}
            onPress={() => {
              navigate(address)
            }}
            onPressIn={() => preload(address)}>
            <BaseCard.Shadow>
              {isEditing ? (
                <RemoveButton
                  position="absolute"
                  right={-8}
                  top={-8}
                  onPress={() => onRemove(address)}
                />
              ) : null}
              <AddressDisplay address={address} direction="column" size={40} variant="smallLabel" />
            </BaseCard.Shadow>
          </Button>
          {lastColumn ? null : <Box width={GAP_SIZE} />}
        </>
      )
    },
    [isEditing, navigate, onRemove, preload]
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
