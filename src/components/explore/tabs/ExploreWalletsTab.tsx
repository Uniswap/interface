import React, { useState } from 'react'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { SearchWalletItem } from 'src/components/explore/search/items/SearchWalletItem'
import { TRENDING_WALLETS } from 'src/components/explore/search/SearchEmptySection'
import { WatchedWalletsCard } from 'src/components/explore/WatchedWalletsCard'
import { WalletSearchResult } from 'src/features/explore/searchHistorySlice'
import { theme } from 'src/styles/theme'

const renderWalletItem = ({ item: wallet }: ListRenderItemInfo<WalletSearchResult>) => (
  <SearchWalletItem wallet={wallet} />
)

function walletKey(wallet: WalletSearchResult) {
  return wallet.address
}

function ExploreWalletsTab({
  onSearchWallets,
  listRef,
}: {
  onSearchWallets: () => void
  listRef?: React.MutableRefObject<null>
}) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <FlatList
      ref={listRef}
      ListHeaderComponent={
        <WatchedWalletsCard
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          onSearchWallets={onSearchWallets}
        />
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
