import { default as React, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { FadeIn } from 'react-native-reanimated'
import { useAppSelector } from 'src/app/hooks'
import { FavoriteHeaderRow } from 'src/components/explore/FavoriteHeaderRow'
import FavoriteWalletCard from 'src/components/explore/FavoriteWalletCard'
import { AnimatedBox, Box, Flex } from 'src/components/layout'
import { Loader } from 'src/components/loading'
import { selectWatchedAddressSet } from 'src/features/favorites/selectors'
import { theme } from 'src/styles/theme'

const NUM_COLUMNS = 2
const GAP_SIZE = theme.spacing.xs
const ITEM_FLEX = { flex: 1 / NUM_COLUMNS }

/** Renders the favorite wallets section on the Explore tab */
export function FavoriteWalletsGrid({
  isEditing,
  setIsEditing,
  showLoading,
}: {
  isEditing: boolean
  setIsEditing: (update: boolean) => void
  showLoading: boolean
}) {
  const { t } = useTranslation()
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
            style={ITEM_FLEX}
          />
          {lastColumn ? null : <Box width={GAP_SIZE} />}
        </>
      )
    },
    [isEditing, setIsEditing]
  )

  return (
    <AnimatedBox entering={FadeIn}>
      <FavoriteHeaderRow
        editingTitle={t('Edit favorite wallets')}
        isEditing={isEditing}
        title={t('Favorite wallets')}
        onPress={() => setIsEditing(!isEditing)}
      />
      {showLoading ? (
        <FavoriteWalletsGridLoader />
      ) : (
        <FlatList
          ItemSeparatorComponent={renderItemSeparator}
          data={watchedWalletsList}
          keyExtractor={(address) => address}
          listKey="explore-favorite-wallets"
          numColumns={NUM_COLUMNS}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />
      )}
    </AnimatedBox>
  )
}

const renderItemSeparator = () => <Box height={GAP_SIZE} />

function FavoriteWalletsGridLoader() {
  return (
    <Flex row gap="xs">
      <Box style={ITEM_FLEX}>
        <Loader.Favorite height={48} />
      </Box>
      <Box style={ITEM_FLEX}>
        <Loader.Favorite height={48} />
      </Box>
    </Flex>
  )
}
