import React from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { SearchWalletItem } from 'src/components/explore/search/items/SearchWalletItem'
import { TRENDING_WALLETS } from 'src/components/explore/search/SearchEmptySection'
import { WatchedWalletsCard } from 'src/components/explore/WatchedWalletsCard'
import { Flex } from 'src/components/layout'
import {
  TabViewScrollProps,
  TAB_VIEW_SCROLL_THROTTLE,
} from 'src/components/layout/screens/TabbedScrollScreen'
import { Separator } from 'src/components/layout/Separator'
import { Text } from 'src/components/Text'
import { WalletSearchResult } from 'src/features/explore/searchHistorySlice'

const renderWalletItem = ({ item: wallet }: ListRenderItemInfo<WalletSearchResult>) => (
  <SearchWalletItem wallet={wallet} />
)

function walletKey(wallet: WalletSearchResult) {
  return wallet.address
}

export default function ExploreWalletsTab({
  tabViewScrollProps,
  onSearchWallets,
  listRef,
}: {
  tabViewScrollProps: TabViewScrollProps
  onSearchWallets: () => void
  listRef?: React.MutableRefObject<null>
}) {
  const { t } = useTranslation()
  return (
    <FlatList
      ref={listRef}
      ItemSeparatorComponent={() => <Separator mx="xs" />}
      ListHeaderComponent={
        <Flex gap="xs" my="sm">
          <Text color="textSecondary" mb="xxs" mx="xs" variant="subheadSmall">
            {t('Wallets')}
          </Text>
          <WatchedWalletsCard onSearchWallets={onSearchWallets} />
        </Flex>
      }
      data={TRENDING_WALLETS}
      keyExtractor={walletKey}
      listKey="wallets"
      renderItem={renderWalletItem}
      scrollEventThrottle={TAB_VIEW_SCROLL_THROTTLE}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={tabViewScrollProps.contentContainerStyle}
    />
  )
}
