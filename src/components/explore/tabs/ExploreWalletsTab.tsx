import { default as React, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { FavoriteWalletsGrid } from 'src/components/explore/FavoriteWalletsGrid'
import { SearchWalletItem } from 'src/components/explore/search/items/SearchWalletItem'
import { TRENDING_WALLETS } from 'src/components/explore/search/SearchEmptySection'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { WalletSearchResult } from 'src/features/explore/searchHistorySlice'
import { selectHasWatchedWallets, selectWatchedAddressSet } from 'src/features/favorites/selectors'
import { theme } from 'src/styles/theme'

function walletKey(wallet: WalletSearchResult) {
  return wallet.address
}

function ExploreWalletsTab({ listRef }: { listRef?: React.MutableRefObject<null> }) {
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)
  const watchedWalletsSet = useAppSelector(selectWatchedAddressSet)

  const renderWalletItem = useCallback(
    ({ item: wallet }: ListRenderItemInfo<WalletSearchResult>) => {
      const isFavorited = watchedWalletsSet.has(wallet.address)
      return <SearchWalletItem isEditing={isEditing} isFavorited={isFavorited} wallet={wallet} />
    },
    [isEditing, watchedWalletsSet]
  )
  const hasFavoritedWallets = useAppSelector(selectHasWatchedWallets)

  return (
    <FlatList
      ref={listRef}
      ListHeaderComponent={
        <Flex my="sm">
          {hasFavoritedWallets ? (
            <FavoriteWalletsGrid isEditing={isEditing} setIsEditing={setIsEditing} />
          ) : null}
          <Text color="textSecondary" variant="smallLabel">
            {t('Suggested wallets')}
          </Text>
        </Flex>
      }
      contentContainerStyle={{ paddingVertical: theme.spacing.md }}
      data={TRENDING_WALLETS}
      keyExtractor={walletKey}
      listKey="wallets"
      renderItem={renderWalletItem}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    />
  )
}

export default React.memo(ExploreWalletsTab)
