import React, { useCallback, useState } from 'react'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Screen } from 'src/components/layout/Screen'
import { NFTAssetItem } from 'src/components/NFT/NFTAssetItem'
import { NFTAssetModal } from 'src/components/NFT/NFTAssetModal'
import { Text } from 'src/components/Text'
import { OpenseaNFTAsset } from 'src/features/nfts/types'
import { Screens } from 'src/screens/Screens'

export function NFTCollectionScreen({ route }: AppStackScreenProp<Screens.NFTCollection>) {
  const [showNFTModal, setShowNFTModal] = useState(false)
  const [selectedNFTAsset, setSelectedNFTAsset] = useState<OpenseaNFTAsset>()

  const { nftAssets } = route.params

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<OpenseaNFTAsset>) => (
      <NFTAssetItem nft={item} onPress={(nftAsset) => onPressNFT(nftAsset)} />
    ),
    []
  )

  const onPressNFT = (nftAsset: OpenseaNFTAsset) => {
    setSelectedNFTAsset(nftAsset)
    setShowNFTModal(true)
  }

  return (
    <Screen>
      <Box mx="lg">
        <CenterBox flexDirection="row" justifyContent="space-between" my="md">
          <BackButton />
          <Box alignItems="center" flexDirection="row">
            <Text variant="h4">{nftAssets[0].collection.name}</Text>
          </Box>
          <Box height={40} width={40} />
        </CenterBox>
        <FlatList data={nftAssets} keyExtractor={key} numColumns={2} renderItem={renderItem} />
      </Box>
      <NFTAssetModal
        isVisible={showNFTModal}
        nftAsset={selectedNFTAsset}
        onClose={() => setShowNFTModal(false)}
      />
    </Screen>
  )
}

function key(nft: OpenseaNFTAsset) {
  return nft.id.toString()
}
