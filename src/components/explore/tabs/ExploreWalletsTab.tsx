import { default as React, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { FavoriteWalletsGrid } from 'src/components/explore/FavoriteWalletsGrid'
import { SearchWalletItem } from 'src/components/explore/search/items/SearchWalletItem'
import { SUGGESTED_WALLETS } from 'src/components/explore/search/SearchEmptySection'
import { Flex } from 'src/components/layout/Flex'
import { TAB_STYLES } from 'src/components/layout/TabHelpers'
import { Text } from 'src/components/Text'
import { WalletSearchResult } from 'src/features/explore/searchHistorySlice'
import { selectHasWatchedWallets, selectWatchedAddressSet } from 'src/features/favorites/selectors'

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
        <Flex mt="sm">
          {hasFavoritedWallets ? (
            <FavoriteWalletsGrid isEditing={isEditing} setIsEditing={setIsEditing} />
          ) : null}
          <Text color="textSecondary" mb="xxs" variant="subheadSmall">
            {t('Suggested wallets')}
          </Text>
        </Flex>
      }
      data={SUGGESTED_WALLETS}
      keyExtractor={walletKey}
      listKey="wallets"
      renderItem={renderWalletItem}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={TAB_STYLES.tabContentContainerStandard}
    />
  )
}

export default React.memo(ExploreWalletsTab)
