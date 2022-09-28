import React from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { SearchWalletItem } from 'src/components/explore/search/items/SearchWalletItem'
import { TRENDING_WALLETS } from 'src/components/explore/search/SearchEmptySection'
import { WatchedWalletsCard } from 'src/components/explore/WatchedWalletsCard'
import { AnimatedBox, Flex } from 'src/components/layout'
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
  onSearchWallets,
  listRef,
}: {
  onSearchWallets: () => void
  listRef?: React.MutableRefObject<null>
}) {
  const { t } = useTranslation()
  return (
    <AnimatedBox entering={FadeIn} exiting={FadeOut}>
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
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </AnimatedBox>
  )
}
