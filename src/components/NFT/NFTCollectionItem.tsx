import React from 'react'
import { ListRenderItemInfo } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { Box } from 'src/components/layout/Box'
import { NFTAssetItem } from 'src/components/NFT/NFTAssetItem'
import { Text } from 'src/components/Text'
import { OpenseaNFTAsset } from 'src/features/nfts/types'
import { ElementName } from 'src/features/telemetry/constants'
import { theme } from 'src/styles/theme'

interface Props {
  nftAssets: OpenseaNFTAsset[]
  onPressCollection: (nftAssets: OpenseaNFTAsset[]) => void
  onPressNFT: (nftAsset: OpenseaNFTAsset) => void
}

export function NFTCollectionItem({ nftAssets, onPressCollection, onPressNFT }: Props) {
  const renderItem = ({ item }: ListRenderItemInfo<OpenseaNFTAsset>) => (
    <NFTAssetItem nft={item} onPress={() => onPressNFT(item)} />
  )

  return (
    <Button name={ElementName.NFTCollectionItem} onPress={() => onPressCollection(nftAssets)}>
      <Box
        bg="tabBackground"
        borderRadius="sm"
        flexDirection="column"
        justifyContent="space-between"
        mx="md"
        my="xs"
        py="md">
        <Box flexDirection="row" justifyContent="space-between" mb="md" mx="md">
          <Text fontWeight="500" variant="body">
            {nftAssets[0].collection.name}
          </Text>
          <Chevron color={theme.colors.gray400} direction="e" height={16} width={16} />
        </Box>
        <FlatList
          horizontal
          contentContainerStyle={{ paddingLeft: theme.spacing.xs }}
          data={nftAssets}
          keyExtractor={key}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
        />
      </Box>
    </Button>
  )
}

function key(nft: OpenseaNFTAsset) {
  return nft.id.toString()
}
