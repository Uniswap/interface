import React, { useMemo } from 'react'
import { ListRenderItemInfo } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { useHomeStackNavigation } from 'src/app/navigation/types'
import VerifiedIcon from 'src/assets/icons/verified.svg'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { NFTAsset } from 'src/features/nfts/types'
import { ElementName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'
import { dimensions } from 'src/styles/sizing'
import { theme } from 'src/styles/theme'
import { getChecksumAddress } from 'src/utils/addresses'

interface Props {
  nftAssets: NFTAsset.Asset[]
  owner: string | undefined
}

export function NFTGroupByCollection({ nftAssets, owner }: Props) {
  const groupedNFTs = useMemo(() => {
    return Array.from(
      nftAssets
        .reduce((acc, item) => {
          const collectionAddress = item.asset_contract.address
          if (acc.has(collectionAddress)) {
            acc.get(collectionAddress)!.push(item)
          } else {
            acc.set(collectionAddress, [item])
          }
          return acc
        }, new Map<string, NFTAsset.Asset[]>())
        .values()
    )
  }, [nftAssets])

  return (
    <Flex>
      {groupedNFTs.map((collection) => (
        <NFTCollectionItem
          key={collection[0].asset_contract.address}
          nftAssets={collection}
          owner={owner}
        />
      ))}
    </Flex>
  )
}

function NFTCollectionItem({ nftAssets, owner }: Props) {
  // confirm this works from external profiles too
  const navigation = useHomeStackNavigation()

  const renderItem = ({ item }: ListRenderItemInfo<NFTAsset.Asset>) => (
    <Button
      marginRight="xxxs"
      width={dimensions.fullWidth / 3}
      onPress={() =>
        navigation.navigate(Screens.NFTItem, {
          owner: owner || '',
          address: item.asset_contract.address,
          token_id: item.token_id,
        })
      }>
      <NFTViewer uri={item.image_url} />
    </Button>
  )

  if (!nftAssets[0]) return null

  const { safelist_request_status, name, slug } = nftAssets[0].collection
  // address is the same for all assets in a collection so just take the address from the first one.
  const collectionAddress = nftAssets[0].asset_contract.address

  return (
    <Flex gap="none">
      <Button
        name={ElementName.NFTCollectionItem}
        onPress={() =>
          navigation.navigate(Screens.NFTCollection, {
            collectionAddress: getChecksumAddress(collectionAddress),
            slug,
            owner,
          })
        }>
        <Box borderColor="backgroundOutline" borderRadius="md" flexDirection="column">
          <Flex borderRadius="md" gap="md" py="md">
            <Flex row gap="sm" mx="md">
              <Flex fill row alignItems="center" gap="xs">
                <Text
                  color="textSecondary"
                  numberOfLines={1}
                  style={flex.shrink}
                  variant="bodySmall">
                  {name}
                </Text>
                {safelist_request_status === 'verified' && (
                  <VerifiedIcon fill={theme.colors.accentActive} height={16} width={16} />
                )}
              </Flex>
              <Chevron color={theme.colors.textSecondary} direction="e" height={20} width={20} />
            </Flex>
          </Flex>
        </Box>
      </Button>
      <FlatList
        horizontal
        data={nftAssets}
        keyExtractor={key}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
      />
    </Flex>
  )
}

function key(nft: NFTAsset.Asset) {
  return nft.id.toString()
}
