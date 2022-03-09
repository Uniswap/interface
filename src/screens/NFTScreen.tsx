import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, FlatList, ListRenderItemInfo } from 'react-native'
import { TabScreenProp } from 'src/app/navigation/types'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Screen } from 'src/components/layout/Screen'
import { NFTAssetModal } from 'src/components/NFT/NFTAssetModal'
import { NFTCollectionItem } from 'src/components/NFT/NFTCollectionItem'
import { Text } from 'src/components/Text'
import { OpenseaNFTAsset } from 'src/features/nfts/types'
import { useAllNFTs } from 'src/features/nfts/useNfts'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens, Tabs } from 'src/screens/Screens'
import { bottomTabBarPadding } from 'src/styles/sizing'
import { theme } from 'src/styles/theme'

export function NFTScreen({ navigation }: TabScreenProp<Tabs.NFT>) {
  const [showNFTModal, setShowNFTModal] = useState(false)
  const [selectedNFTAsset, setSelectedNFTAsset] = useState<OpenseaNFTAsset>()

  const { t } = useTranslation()
  const activeAccount = useActiveAccount()

  const { nftsByCollection, loading } = useAllNFTs(activeAccount?.address)

  const onPressNFT = (nftAsset: OpenseaNFTAsset) => {
    setSelectedNFTAsset(nftAsset)
    setShowNFTModal(true)
  }

  const renderItem = ({ item }: ListRenderItemInfo<OpenseaNFTAsset[]>) => {
    const onPressCollection = (nftAssets: OpenseaNFTAsset[]) => {
      navigation.navigate(Screens.NFTCollection, { nftAssets: nftAssets })
    }

    return (
      <NFTCollectionItem
        nftAssets={item}
        onPressCollection={(nftAssets) => onPressCollection(nftAssets)}
        onPressNFT={(nftAsset) => onPressNFT(nftAsset)}
      />
    )
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Box mb="sm" mt="lg" mx="lg">
        <Text variant="h3">{t('Your NFTs')}</Text>
      </Box>
      {loading ? (
        <ActivityIndicator color={theme.colors.gray100} size={25} />
      ) : (
        <FlatList
          ListEmptyComponent={
            <CenterBox m="md">
              <Text color="gray200" variant={'bodyBold'}>
                {t('No NFTs found')}
              </Text>
            </CenterBox>
          }
          contentContainerStyle={{ paddingBottom: bottomTabBarPadding }}
          data={nftsByCollection}
          keyExtractor={key}
          renderItem={renderItem}
        />
      )}
      <NFTAssetModal
        isVisible={showNFTModal}
        nftAsset={selectedNFTAsset}
        onClose={() => setShowNFTModal(false)}
      />
    </Screen>
  )
}

function key(nftAssets: OpenseaNFTAsset[]) {
  return nftAssets[0].collection.slug
}
