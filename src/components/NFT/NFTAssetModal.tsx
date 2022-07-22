import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Share, StyleSheet } from 'react-native'
import ShareIcon from 'src/assets/icons/share.svg'
import VerifiedIcon from 'src/assets/icons/verified.svg'
import OpenSeaIcon from 'src/assets/logos/opensea.svg'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { SendButton } from 'src/components/buttons/SendButton'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { BottomSheetScrollModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { NFTAsset } from 'src/features/nfts/types'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { flex } from 'src/styles/flex'
import { nftCollectionBlurImageStyle } from 'src/styles/image'
import { theme } from 'src/styles/theme'
import { openUri } from 'src/utils/linking'
import { logger } from 'src/utils/logger'

interface Props {
  nftAsset?: NFTAsset.Asset
  isVisible: boolean
  onClose: () => void
}

const COLLECTION_IMAGE_WIDTH = 20

export function NFTAssetModal({ nftAsset, isVisible, onClose }: Props) {
  const { t } = useTranslation()

  const initialSendState = useMemo(() => {
    return nftAsset
      ? {
          exactCurrencyField: CurrencyField.INPUT,
          exactAmountToken: '',
          [CurrencyField.INPUT]: {
            chainId: ChainId.Mainnet,
            address: nftAsset.asset_contract.address,
            tokenId: nftAsset.token_id,
            type:
              nftAsset.asset_contract.schema_name === 'ERC1155'
                ? AssetType.ERC1155
                : AssetType.ERC721,
          },
          [CurrencyField.OUTPUT]: null,
        }
      : undefined
  }, [nftAsset])

  if (!nftAsset) return null

  const { name, image_url: imageUrl, collection, permalink } = nftAsset
  const {
    image_url: collectionImageUrl,
    name: collectionName,
    description: collectionDescription,
    safelist_request_status: safelistRequestStatus,
  } = collection

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
          <NFTViewer uri={imageUrl} />
        </Box>
        <Flex alignItems="center" flexDirection="row" mt="xs">
          <Text style={flex.fill} variant="headlineSmall">
            {name}
          </Text>
          <Flex>
            <Button onPress={onPressShare}>
              <ShareIcon color={theme.colors.textTertiary} height={24} width={24} />
            </Button>
          </Flex>
        </Flex>
        <Flex centered row>
          <PrimaryButton
            flex={1}
            icon={<OpenSeaIcon color={theme.colors.white} height={20} width={20} />}
            label={t('View')}
            name={ElementName.NFTAssetViewOnOpensea}
            testID={ElementName.NFTAssetViewOnOpensea}
            variant="black"
            onPress={() => openUri(permalink)}
          />
          <SendButton flex={1} initialState={initialSendState} />
        </Flex>
        <Flex gap="sm">
          <Box
            bg="translucentBackground"
            borderColor="backgroundOutline"
            borderRadius="md"
            borderWidth={1}>
            {collectionImageUrl && (
              <Image
                blurRadius={5}
                source={{ uri: collectionImageUrl }}
                style={[StyleSheet.absoluteFill, nftCollectionBlurImageStyle]}
              />
            )}
            <Flex
              bg={collectionImageUrl ? 'imageTintBackground' : 'translucentBackground'}
              borderColor="backgroundOutline"
              borderRadius="md"
              borderWidth={1}
              gap="sm"
              p="md">
              <Text
                color="textSecondary"
                style={flex.fill}
                variant="bodySmall">{t`From the Collection`}</Text>
              <Flex row alignItems="center" gap="xs">
                <Box height={COLLECTION_IMAGE_WIDTH} width={COLLECTION_IMAGE_WIDTH}>
                  <NFTViewer uri={collectionImageUrl} />
                </Box>
                <Text ml="xs" variant="body">
                  {collectionName}
                </Text>
                {safelistRequestStatus === 'verified' && (
                  <VerifiedIcon fill={theme.colors.accentActive} height={16} width={16} />
                )}
              </Flex>
            </Flex>
          </Box>
          <Flex gap="md" mt="sm">
            <Text variant="mediumLabel">{t`Description`}</Text>
            <Text color="textSecondary" variant="bodySmall">
              {collectionDescription}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </BottomSheetScrollModal>
  )
}
