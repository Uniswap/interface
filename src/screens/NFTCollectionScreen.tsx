import { skipToken } from '@reduxjs/toolkit/dist/query'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Image, ListRenderItemInfo, Share, StyleSheet } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { AppStackScreenProp } from 'src/app/navigation/types'
import ShareIcon from 'src/assets/icons/share.svg'
import VerifiedIcon from 'src/assets/icons/verified.svg'
import OpenSeaIcon from 'src/assets/logos/opensea.svg'
import { BackButton } from 'src/components/buttons/BackButton'
import { Button } from 'src/components/buttons/Button'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { NFTAssetItem } from 'src/components/NFT/NFTAssetItem'
import { NFTAssetModal } from 'src/components/NFT/NFTAssetModal'
import { Text } from 'src/components/Text'
import { useNftBalancesQuery, useNftCollectionQuery } from 'src/features/nfts/api'
import { NFTAsset } from 'src/features/nfts/types'
import { ElementName, SectionName } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'
import { nftCollectionBlurImageStyle } from 'src/styles/image'
import { dimensions } from 'src/styles/sizing'
import { theme } from 'src/styles/theme'
import { formatNumber } from 'src/utils/format'
import { openUri } from 'src/utils/linking'
import { logger } from 'src/utils/logger'

interface Props {
  collection?: NFTAsset.Collection
  collectionName: string
}

const HORIZONTAL_MARGIN = theme.spacing.md * 2
const ITEM_HORIZONTAL_MARGIN = theme.spacing.sm * 2
const NUM_COLUMNS = 2
const ITEM_WIDTH =
  (dimensions.fullWidth - HORIZONTAL_MARGIN - ITEM_HORIZONTAL_MARGIN * NUM_COLUMNS) / NUM_COLUMNS

function NFTCollectionHeader({ collection, collectionName }: Props) {
  const { t } = useTranslation()
  const appTheme = useAppTheme()

  return (
    <Trace section={SectionName.NFTCollectionHeader}>
      <Flex gap="xxs">
        <Box my="sm">
          {collection?.image_url && (
            <Image
              blurRadius={5}
              source={{ uri: collection.image_url }}
              style={[StyleSheet.absoluteFill, nftCollectionBlurImageStyle]}
            />
          )}
          <Flex
            bg={collection?.image_url ? 'imageTintBackground' : 'translucentBackground'}
            borderColor="deprecated_gray100"
            borderRadius="md"
            borderWidth={1}
            gap="sm"
            p="md">
            <Flex row alignItems="center" gap="sm">
              {collection?.image_url && (
                <RemoteImage
                  borderRadius={theme.borderRadii.md}
                  height={24}
                  imageUrl={collection?.image_url}
                  width={24}
                />
              )}
              <Text style={flex.shrink} variant="mediumLabel">
                {collectionName}
              </Text>
              {collection?.safelist_request_status === 'verified' && (
                <VerifiedIcon height={16} width={16} />
              )}
            </Flex>
            {collection?.description && (
              <Text color="deprecated_gray400" variant="caption">
                {collection?.description}
              </Text>
            )}
            <Flex flexDirection="row" gap="md">
              {collection?.external_url && (
                <Button
                  borderRadius="md"
                  name={ElementName.NFTCollectionWebsite}
                  testID={ElementName.NFTCollectionWebsite}
                  onPress={() => collection?.external_url && openUri(collection?.external_url)}>
                  <Text fontWeight="600" variant="caption">
                    {t('Website ↗')}
                  </Text>
                </Button>
              )}
              {collection?.twitter_username && (
                <Button
                  borderRadius="md"
                  name={ElementName.NFTCollectionTwitter}
                  testID={ElementName.NFTCollectionTwitter}
                  onPress={() => openUri(`https://twitter.com/${collection?.twitter_username}`)}>
                  <Text fontWeight="600" variant="caption">
                    {t('Twitter ↗')}
                  </Text>
                </Button>
              )}
              {collection?.discord_url && (
                <Button
                  borderRadius="md"
                  name={ElementName.NFTCollectionDiscord}
                  testID={ElementName.NFTCollectionDiscord}
                  onPress={() => collection?.discord_url && openUri(collection?.discord_url)}>
                  <Text fontWeight="600" variant="caption">
                    {t('Discord ↗')}
                  </Text>
                </Button>
              )}
            </Flex>
            <Flex flexDirection="row" gap="xl">
              <Flex gap="xs">
                <Text color="deprecated_gray400" variant="caption">
                  {t('Items')}
                </Text>
                {collection?.stats.total_supply && (
                  <Text fontWeight="600" variant="h3">
                    {formatNumber(collection?.stats.total_supply)}
                  </Text>
                )}
              </Flex>
              <Flex gap="xs">
                <Text color="deprecated_gray400" variant="caption">
                  {t('Owners')}
                </Text>
                {collection?.stats.num_owners && (
                  <Text fontWeight="600" variant="h3">
                    {formatNumber(collection?.stats.num_owners)}
                  </Text>
                )}
              </Flex>
              {collection?.stats.floor_price && (
                <Flex gap="xs">
                  <Text color="deprecated_gray400" variant="caption">
                    {t('Floor')}
                  </Text>
                  <Text fontWeight="600" variant="h3">
                    {t('{{price}} ETH', { price: collection?.stats.floor_price })}
                  </Text>
                </Flex>
              )}
            </Flex>
          </Flex>
        </Box>
        <Button
          bg="deprecated_gray50"
          borderColor="deprecated_gray200"
          borderRadius="md"
          borderWidth={1}
          name={ElementName.NFTCollectionViewOnOpensea}
          py="sm"
          testID={ElementName.NFTCollectionViewOnOpensea}
          onPress={() => openUri(`https://opensea.io/collection/${collection?.slug}`)}>
          <Flex alignItems="center" flexDirection="row" gap="xs" justifyContent="center">
            <OpenSeaIcon color={appTheme.colors.deprecated_textColor} height={16} width={16} />
            <Text variant="body1">{t('View Collection')}</Text>
          </Flex>
        </Button>
        <Text mt="md" variant="mediumLabel">
          {t('Your {{collection}}', { collection: collectionName })}
        </Text>
      </Flex>
    </Trace>
  )
}

export function NFTCollectionScreen({ route }: AppStackScreenProp<Screens.NFTCollection>) {
  const [showNFTModal, setShowNFTModal] = useState(false)
  const [selectedNFTAsset, setSelectedNFTAsset] = useState<NFTAsset.Asset>()
  const activeAddress = useActiveAccount()?.address
  const { address, slug } = route.params

  const appTheme = useAppTheme()

  const { currentData: nftsByCollection } = useNftBalancesQuery(
    activeAddress ? { owner: activeAddress } : skipToken
  )
  const nftAssets = nftsByCollection?.[address]

  const { currentData: collection } = useNftCollectionQuery({
    openseaSlug: slug,
  })

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<NFTAsset.Asset>) => (
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

  const onPressNFT = (nftAsset: NFTAsset.Asset) => {
    setSelectedNFTAsset(nftAsset)
    setShowNFTModal(true)
  }

  const onPressShare = async () => {
    try {
      await Share.share({
        title: collection?.name,
        url: `https://opensea.io/collection/${collection?.slug}`,
      })
    } catch (e) {
      logger.error('NFTCollectionScreen', 'onPressShare', 'Error sharing NFT Collection', e)
    }
  }

  return (
    <Screen>
      <Box flex={1}>
        <Flex flexDirection="row" gap="lg" justifyContent="space-between" mx="lg" my="md">
          <BackButton />
          <Text numberOfLines={1} style={flex.shrink} variant="mediumLabel">
            {collection?.name}
          </Text>
          <Button onPress={onPressShare}>
            <ShareIcon color={appTheme.colors.neutralTextTertiary} height={24} width={24} />
          </Button>
        </Flex>
        <FlatList
          ListHeaderComponent={
            <Box mb="sm" mx="lg">
              <NFTCollectionHeader
                collection={collection}
                collectionName={collection?.name ?? ''}
              />
            </Box>
          }
          columnWrapperStyle={{ marginHorizontal: theme.spacing.md }}
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

function key(nft: NFTAsset.Asset) {
  return nft.id.toString()
}
