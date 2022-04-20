import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Share, StyleSheet } from 'react-native'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { VERIFIED_ICON } from 'src/assets'
import SendIcon from 'src/assets/icons/send.svg'
import ShareIcon from 'src/assets/icons/share.svg'
import OpenSeaIcon from 'src/assets/logos/opensea.svg'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { BottomSheetScrollModal } from 'src/components/modals/BottomSheetModal'
import { ApplyNFTPaletteButton, NFTPalette } from 'src/components/NFT/NFTPalette'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { NFTAsset } from 'src/features/nfts/types'
import { isEnabled } from 'src/features/remoteConfig'
import { TestConfig } from 'src/features/remoteConfig/testConfigs'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { Screens } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'
import { nftCollectionBlurImageStyle } from 'src/styles/image'
import { dimensions } from 'src/styles/sizing'
import { theme } from 'src/styles/theme'
import { openUri } from 'src/utils/linking'
import { logger } from 'src/utils/logger'

interface Props {
  nftAsset?: NFTAsset.Asset
  isVisible: boolean
  onClose: () => void
}

const ITEM_WIDTH = dimensions.fullWidth - theme.spacing.lg * 2
const COLLECTION_IMAGE_WIDTH = 20

export function NFTAssetModal({ nftAsset, isVisible, onClose }: Props) {
  const { t } = useTranslation()
  const navigation = useAppStackNavigation()

  if (!nftAsset) return null

  const { name, image_url: imageUrl, collection, permalink } = nftAsset
  const {
    image_url: collectionImageUrl,
    name: collectionName,
    description: collectionDescription,
    safelist_request_status: safelistRequestStatus,
  } = collection

  const onPressSend = () => {
    const transferFormState: TransactionState = {
      exactCurrencyField: CurrencyField.INPUT,
      exactAmount: '',
      [CurrencyField.INPUT]: {
        chainId: ChainId.Mainnet,
        address: nftAsset.asset_contract.address,
        tokenId: nftAsset.token_id,
        type:
          nftAsset.asset_contract.schema_name === 'ERC1155' ? AssetType.ERC1155 : AssetType.ERC721,
      },
      [CurrencyField.OUTPUT]: null,
    }
    navigation.push(Screens.Transfer, { transferFormState })
  }

  const onPressShare = async () => {
    try {
      await Share.share({
        title: `${collectionName}: ${name}`,
        url: `https://opensea.io/collection/${collection?.slug}`,
      })
    } catch (e) {
      logger.error('NFTAssetModal', 'onPressShare', 'Error sharing NFT asset', e)
    }
  }

  return (
    <BottomSheetScrollModal isVisible={isVisible} name={ModalName.NFTAsset} onClose={onClose}>
      <Flex gap="md" mx="lg" my="md">
        <Box>
          <RemoteImage
            borderRadius={theme.borderRadii.lg}
            height={ITEM_WIDTH}
            imageUrl={imageUrl}
            width={ITEM_WIDTH}
          />
          <Flex
            alignItems="flex-end"
            justifyContent="space-between"
            m="md"
            style={StyleSheet.absoluteFill}>
            <ApplyNFTPaletteButton asset={nftAsset} />
            {isEnabled(TestConfig.DisplayExtractedNFTColors) && <NFTPalette asset={nftAsset} />}
          </Flex>
        </Box>
        <Flex alignItems="center" flexDirection="row" mt="xs">
          <Text style={flex.fill} variant="h3">
            {name}
          </Text>
          <Flex>
            <Button onPress={onPressShare}>
              <ShareIcon height={24} width={24} />
            </Button>
          </Flex>
        </Flex>
        <Flex centered row>
          <PrimaryButton
            flex={1}
            icon={<OpenSeaIcon height={20} width={20} />}
            label={t('View')}
            name={ElementName.NFTAssetViewOnOpensea}
            testID={ElementName.NFTAssetViewOnOpensea}
            variant="black"
            onPress={() => openUri(permalink)}
          />
          <PrimaryButton
            flex={1}
            icon={<SendIcon height={20} stroke={theme.colors.white} strokeWidth={2} width={20} />}
            label={t('Send')}
            name={ElementName.Send}
            testID={ElementName.Send}
            variant="black"
            onPress={onPressSend}
          />
        </Flex>
        <Flex gap="sm">
          <Box bg="tabBackground" borderRadius="md">
            {collectionImageUrl && (
              <Image
                blurRadius={5}
                source={{ uri: collectionImageUrl }}
                style={[StyleSheet.absoluteFill, nftCollectionBlurImageStyle]}
              />
            )}
            <Flex bg={collectionImageUrl ? 'imageTintBackground' : 'tabBackground'} gap="sm" p="md">
              <Text
                color="gray400"
                style={flex.fill}
                variant="bodyMd">{t`From the Collection`}</Text>
              <Flex row alignItems="center" gap="xs">
                <RemoteImage
                  borderRadius={theme.borderRadii.full}
                  height={COLLECTION_IMAGE_WIDTH}
                  imageUrl={collectionImageUrl}
                  width={COLLECTION_IMAGE_WIDTH}
                />
                <Text ml="xs" variant="body">
                  {collectionName}
                </Text>
                {safelistRequestStatus === 'verified' && (
                  <Image height={25} source={VERIFIED_ICON} width={25} />
                )}
              </Flex>
            </Flex>
          </Box>
          <Flex gap="md" mt="sm">
            <Text variant="h5">{t`Description`}</Text>
            <Text color="gray400" variant="bodyMd">
              {collectionDescription}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </BottomSheetScrollModal>
  )
}
