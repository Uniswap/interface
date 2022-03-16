import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { AppStackScreenProp } from 'src/app/navigation/types'
import OpenSeaIcon from 'src/assets/logos/opensea.svg'
import { ArrowBackButton } from 'src/components/buttons/BackButton'
import { Button } from 'src/components/buttons/Button'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Screen } from 'src/components/layout/Screen'
import { NFTAssetItem } from 'src/components/NFT/NFTAssetItem'
import { NFTAssetModal } from 'src/components/NFT/NFTAssetModal'
import { Text } from 'src/components/Text'
import { OpenseaNFTAsset, OpenseaNFTCollection } from 'src/features/nfts/types'
import { useNFTCollection } from 'src/features/nfts/useNfts'
import { ElementName, SectionName } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'
import { Screens } from 'src/screens/Screens'
import { dimensions } from 'src/styles/sizing'
import { theme } from 'src/styles/theme'
import { openUri } from 'src/utils/linking'

interface Props {
  collection?: OpenseaNFTCollection
  collectionName: string
}

const HORIZONTAL_MARGIN = theme.spacing.md * 2
const ITEM_HORIZONTAL_MARGIN = theme.spacing.sm * 2
const NUM_COLUMNS = 2
const ITEM_WIDTH =
  (dimensions.fullWidth - HORIZONTAL_MARGIN - ITEM_HORIZONTAL_MARGIN * NUM_COLUMNS) / NUM_COLUMNS

function NFTCollectionHeader({ collection, collectionName }: Props) {
  const { t } = useTranslation()

  return (
    <Trace section={SectionName.NFTCollectionHeader}>
      <Flex gap="xxs">
        <Flex borderColor="gray100" borderRadius="md" borderWidth={1} gap="sm" my="sm" p="md">
          <Flex alignItems="center" flexDirection="row" gap="sm">
            {collection?.image_url && (
              <RemoteImage
                borderRadius={theme.borderRadii.md}
                height={24}
                imageUrl={collection.image_url}
                width={24}
              />
            )}
            <Text variant="h4">{collectionName}</Text>
          </Flex>
          {collection?.description && (
            <Text color="gray400" variant="bodySm">
              {collection.description}
            </Text>
          )}
          <Flex flexDirection="row" gap="md">
            {collection?.external_link && (
              <Button
                borderRadius="md"
                name={ElementName.NFTCollectionWebsite}
                testID={ElementName.NFTCollectionWebsite}
                onPress={() => collection.external_link && openUri(collection.external_link)}>
                <Text variant="bodySm">{t('Website ↗')}</Text>
              </Button>
            )}
            {collection?.twitter_username && (
              <Button
                borderRadius="md"
                name={ElementName.NFTCollectionTwitter}
                testID={ElementName.NFTCollectionTwitter}
                onPress={() => openUri(`https://twitter.com/${collection.twitter_username}`)}>
                <Text variant="bodySm">{t('Twitter ↗')}</Text>
              </Button>
            )}
            {collection?.discord_url && (
              <Button
                borderRadius="md"
                name={ElementName.NFTCollectionDiscord}
                testID={ElementName.NFTCollectionDiscord}
                onPress={() => collection.discord_url && openUri(collection.discord_url)}>
                <Text variant="bodySm">{t('Discord ↗')}</Text>
              </Button>
            )}
          </Flex>
          <Flex flexDirection="row" gap="xl">
            <Flex gap="xs">
              <Text color="gray400" variant="bodySm">
                {t('Items')}
              </Text>
              {collection?.stats.total_supply && (
                <Text variant="h3">{collection.stats.total_supply}</Text>
              )}
            </Flex>
            <Flex gap="xs">
              <Text color="gray400" variant="bodySm">
                {t('Owners')}
              </Text>
              {collection?.stats.num_owners && (
                <Text variant="h3">{collection.stats.num_owners}</Text>
              )}
            </Flex>
            {collection?.stats.floor_price && (
              <Flex gap="xs">
                <Text color="gray400" variant="bodySm">
                  {t('Floor')}
                </Text>
                <Text variant="h3">
                  {t('{{price}} ETH', { price: collection.stats.floor_price })}
                </Text>
              </Flex>
            )}
          </Flex>
        </Flex>
        <Button
          bg="gray50"
          borderColor="gray200"
          borderRadius="md"
          borderWidth={1}
          name={ElementName.NFTCollectionViewOnOpensea}
          py="sm"
          testID={ElementName.NFTCollectionViewOnOpensea}
          onPress={() => openUri(`https://opensea.io/collection/${collection?.slug}`)}>
          <Flex alignItems="center" flexDirection="row" gap="xs" justifyContent="center">
            <OpenSeaIcon height={16} width={16} />
            <Text variant="body">{t('View Collection')}</Text>
          </Flex>
        </Button>
        <Text mt="md" variant="h5">
          {t('Your {{collection}}', { collection: collectionName })}
        </Text>
      </Flex>
    </Trace>
  )
}

export function NFTCollectionScreen({ route }: AppStackScreenProp<Screens.NFTCollection>) {
  const [showNFTModal, setShowNFTModal] = useState(false)
  const [selectedNFTAsset, setSelectedNFTAsset] = useState<OpenseaNFTAsset>()
  const { nftAssets } = route.params

  // Use nftAssets[0] to have prefilled collection info while waiting for new collection info from API
  const { collection } = useNFTCollection(nftAssets[0].collection.slug)

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<OpenseaNFTAsset>) => (
      <NFTAssetItem
        mx="sm"
        my="sm"
        nft={item}
        size={ITEM_WIDTH}
        onPress={(nftAsset) => onPressNFT(nftAsset)}
      />
    ),
    []
  )

  const onPressNFT = (nftAsset: OpenseaNFTAsset) => {
    setSelectedNFTAsset(nftAsset)
    setShowNFTModal(true)
  }

  return (
    <Screen>
      <Box flex={1}>
        <CenterBox flexDirection="row" justifyContent="space-between" mx="lg" my="md">
          <ArrowBackButton />
          <Box alignItems="center" flexDirection="row">
            <Text variant="h4">{nftAssets[0].collection.name}</Text>
          </Box>
          <Box height={20} width={20} />
        </CenterBox>
        <FlatList
          ListHeaderComponent={
            <Box mb="sm" mx="lg">
              <NFTCollectionHeader
                collection={collection}
                collectionName={nftAssets[0].collection.name}
              />
            </Box>
          }
          columnWrapperStyle={{ marginHorizontal: theme.spacing.md }}
          contentContainerStyle={{ paddingBottom: bottomTabBarPadding }}
          data={nftAssets}
          keyExtractor={key}
          numColumns={NUM_COLUMNS}
          renderItem={renderItem}
        />
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
