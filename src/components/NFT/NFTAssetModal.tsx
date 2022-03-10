import React from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, StyleSheet } from 'react-native'
import { useAccountDisplayName } from 'src/components/accounts/useAccountDisplayName'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { BottomSheetScrollModal } from 'src/components/modals/BottomSheetModal'
import { ApplyNFTPaletteButton, NFTPalette } from 'src/components/NFT/NFTPalette'
import { Text } from 'src/components/Text'
import { OpenseaNFTAsset } from 'src/features/nfts/types'
import { isEnabled } from 'src/features/remoteConfig'
import { TestConfig } from 'src/features/remoteConfig/testConfigs'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { borderRadii, dimensions } from 'src/styles/sizing'
import { logger } from 'src/utils/logger'

interface Props {
  nftAsset?: OpenseaNFTAsset
  isVisible: boolean
  onClose: () => void
}

const ITEM_WIDTH = dimensions.fullWidth - 50
const COLLECTION_IMAGE_WIDTH = 30

export function NFTAssetModal({ nftAsset, isVisible, onClose }: Props) {
  const { t } = useTranslation()
  const activeAccount = useActiveAccount()
  const displayName = useAccountDisplayName(activeAccount)

  if (!nftAsset) return null

  const { name, image_url: imageUrl, collection, permalink } = nftAsset
  const {
    image_url: collectionImageUrl,
    name: collectionName,
    description: collectionDescription,
  } = collection

  const openOnOpensea = () => {
    Linking.canOpenURL(permalink).then((supported) => {
      if (supported) {
        Linking.openURL(permalink)
      } else {
        logger.debug('NFTAssetModal', 'openOnOpensea', 'Cannot open Opensea link')
      }
    })
  }

  return (
    <BottomSheetScrollModal isVisible={isVisible} name={ModalName.NFTAsset} onClose={onClose}>
      <Flex mb="xl" mx="lg">
        <Flex alignItems="center" flexDirection="row" gap="sm" mt="md">
          <RemoteImage
            borderRadius={COLLECTION_IMAGE_WIDTH / 2}
            height={COLLECTION_IMAGE_WIDTH}
            imageUrl={collectionImageUrl}
            width={COLLECTION_IMAGE_WIDTH}
          />
          <Text variant="h3">{name}</Text>
        </Flex>
        <Box>
          <RemoteImage
            borderRadius={borderRadii.lg}
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
        <PrimaryButton
          label={t('View on Opensea')}
          name={ElementName.ViewOnOpensea}
          testID={ElementName.ViewOnOpensea}
          variant="gray"
          onPress={openOnOpensea}
        />
        <Flex gap="sm">
          <Flex gap="xs">
            <Text variant="h5">{t`Owned By`}</Text>
            <Box bg="tabBackground" borderRadius="md" p="sm">
              <Text variant="body">{displayName}</Text>
            </Box>
          </Flex>
          <Flex gap="xs">
            <Text variant="h5">{t`Collection`}</Text>
            <Box bg="tabBackground" borderRadius="md" p="sm">
              <Text variant="body">{collectionName}</Text>
            </Box>
          </Flex>
          <Flex gap="xs">
            <Text variant="h5">{t`About this collection`}</Text>
            <Text variant="bodySm">{collectionDescription}</Text>
          </Flex>
        </Flex>
      </Flex>
    </BottomSheetScrollModal>
  )
}
