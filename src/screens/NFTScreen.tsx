import { skipToken } from '@reduxjs/toolkit/dist/query'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, FlatList, ListRenderItemInfo } from 'react-native'
import { TabScreenProp } from 'src/app/navigation/types'
import { Inset } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Screen } from 'src/components/layout/Screen'
import { NFTAssetModal } from 'src/components/NFT/NFTAssetModal'
import { NFTCollectionItem } from 'src/components/NFT/NFTCollectionItem'
import { Text } from 'src/components/Text'
import { useNftBalancesQuery } from 'src/features/nfts/api'
import { NFTAsset } from 'src/features/nfts/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens, Tabs } from 'src/screens/Screens'
import { theme } from 'src/styles/theme'

export function NFTScreen({ navigation }: TabScreenProp<Tabs.NFT>) {
  const [showNFTModal, setShowNFTModal] = useState(false)
  const [selectedNFTAsset, setSelectedNFTAsset] = useState<NFTAsset.Asset>()

  const { t } = useTranslation()
  const activeAccount = useActiveAccount()

  const { currentData: nftsByCollection, isLoading } = useNftBalancesQuery(
    activeAccount ? { owner: activeAccount?.address } : skipToken
  )

  const onPressNFT = (nftAsset: NFTAsset.Asset) => {
    setSelectedNFTAsset(nftAsset)
    setShowNFTModal(true)
  }

  const renderItem = ({ item }: ListRenderItemInfo<NFTAsset.Asset[]>) => {
    const onPressCollection = (nftAssets: NFTAsset.Asset[]) => {
      if (nftAssets.length > 0) {
        navigation.navigate(Screens.NFTCollection, { nftAssets })
      }
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
        <Text variant="h3">{t('Collectibles')}</Text>
      </Box>
      {isLoading ? (
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
          ListFooterComponent={
            <Inset all="xxl">
              <Inset all="md" />
            </Inset>
          }
          data={Object.values(nftsByCollection ?? {})}
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

function key(nftAssets: NFTAsset.Asset[]) {
  return nftAssets[0].collection.slug
}
