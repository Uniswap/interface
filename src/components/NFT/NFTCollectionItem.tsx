import React from 'react'
import { Image, ListRenderItemInfo, StyleSheet } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { VERIFIED_ICON } from 'src/assets'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { NFTAssetItem } from 'src/components/NFT/NFTAssetItem'
import { Text } from 'src/components/Text'
import { NFTAsset } from 'src/features/nfts/types'
import { ElementName } from 'src/features/telemetry/constants'
import { nftCollectionBlurImageStyle } from 'src/styles/image'
import { dimensions } from 'src/styles/sizing'
import { theme } from 'src/styles/theme'

interface Props {
  nftAssets: NFTAsset.Asset[]
  onPressCollection: (nftAssets: NFTAsset.Asset[]) => void
  onPressNFT: (nftAsset: NFTAsset.Asset) => void
}

export function NFTCollectionItem({ nftAssets, onPressCollection, onPressNFT }: Props) {
  const renderItem = ({ item }: ListRenderItemInfo<NFTAsset.Asset>) => (
    <NFTAssetItem
      mx="sm"
      nft={item}
      size={dimensions.fullWidth / 3}
      onPress={(nftAsset) => onPressNFT(nftAsset)}
    />
  )

  const { image_url, safelist_request_status, name } = nftAssets[0].collection

  return (
    <Button name={ElementName.NFTCollectionItem} onPress={() => onPressCollection(nftAssets)}>
      <Box
        borderColor="gray100"
        borderRadius="md"
        borderWidth={1}
        flexDirection="column"
        justifyContent="space-between"
        mx="md"
        my="sm">
        {image_url && (
          <Image
            blurRadius={5}
            source={{ uri: image_url }}
            style={[StyleSheet.absoluteFill, nftCollectionBlurImageStyle]}
          />
        )}
        <Box bg={image_url ? 'imageTintBackground' : 'tabBackground'} borderRadius="md" py="md">
          <Box flexDirection="row" justifyContent="space-between" mb="md" mx="md">
            <Flex alignItems="center" flexDirection="row" gap="sm">
              {image_url && (
                <RemoteImage
                  borderRadius={theme.borderRadii.md}
                  height={20}
                  imageUrl={image_url}
                  width={20}
                />
              )}
              <Text variant="body">{name}</Text>
              {safelist_request_status === 'verified' && (
                <Image height={20} source={VERIFIED_ICON} width={20} />
              )}
            </Flex>
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
      </Box>
    </Button>
  )
}

function key(nft: NFTAsset.Asset) {
  return nft.id.toString()
}
