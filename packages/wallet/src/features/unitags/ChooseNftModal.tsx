import { useTranslation } from 'react-i18next'
import { Flex, FlexProps, SpaceTokens, Text, useSporeColors } from 'ui/src'
import { X } from 'ui/src/components/icons'
import { spacing } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalProps } from 'uniswap/src/components/modals/ModalProps'
// This is intentionally imported from the native file as only the web app requires a web specific implementation
import { NftsList } from 'uniswap/src/components/nfts/NftsList.native'
import { NftView } from 'uniswap/src/components/nfts/NftView'
import { NftViewWithContextMenu } from 'uniswap/src/components/nfts/NftViewWithContextMenu'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { isMobileApp, isWebPlatform } from 'utilities/src/platform'
import { ChoosePhotoOptionsProps } from 'wallet/src/features/unitags/ChoosePhotoOptionsModal'
import { useAccounts } from 'wallet/src/features/wallet/hooks'

export const NFT_MODAL_MAX_WIDTH = 610

export const extensionNftModalProps: ChoosePhotoOptionsProps['nftModalProps'] = {
  includeContextMenu: false,
  itemMargin: '$spacing6',
  containerProps: { m: -spacing.spacing6 }, // Cancels out the margin on each NFT item
  modalMaxWidth: NFT_MODAL_MAX_WIDTH,
  numColumns: 4,
}

export type ChooseNftModalProps = {
  address: string
  includeContextMenu?: boolean
  itemMargin?: SpaceTokens
  numColumns?: number
  containerProps?: FlexProps
  modalMaxWidth?: ModalProps['maxWidth']
  setPhotoUri: (uri?: string) => void
  onClose: () => void
}

export const ChooseNftModal = ({
  address,
  includeContextMenu = true,
  itemMargin = '$spacing4',
  numColumns,
  containerProps,
  modalMaxWidth,
  setPhotoUri,
  onClose,
}: ChooseNftModalProps): JSX.Element => {
  const colors = useSporeColors()
  const insets = useAppInsets()
  const { t } = useTranslation()
  const accounts = useAccounts()

  const renderNFT = (item: NFTItem): JSX.Element => {
    const onPressNft = (): void => {
      setPhotoUri(item.imageUrl)
      onClose()
    }

    const walletAddresses = Object.keys(accounts)

    return (
      <Flex fill m={itemMargin}>
        {includeContextMenu ? (
          <NftViewWithContextMenu item={item} owner={address} walletAddresses={walletAddresses} onPress={onPressNft} />
        ) : (
          <NftView item={item} walletAddresses={walletAddresses} onPress={onPressNft} />
        )}
      </Flex>
    )
  }

  const renderedInBottomSheet = isMobileApp

  return (
    <Modal
      overrideInnerContainer
      backgroundColor={colors.surface1.val}
      hideHandlebar={false}
      isDismissible={renderedInBottomSheet}
      name={ModalName.NftCollection}
      maxWidth={modalMaxWidth}
      padding={isWebPlatform ? spacing.spacing24 : undefined}
      onClose={onClose}
    >
      <Flex fill gap="$spacing24">
        {isWebPlatform ? (
          <Flex row centered>
            <Flex grow centered>
              <Text color="$neutral1" variant="subheading1">
                {t('unitags.choosePhoto.option.nft')}
              </Text>
            </Flex>
            <X position="absolute" left={0} size="$icon.24" cursor="pointer" color="$neutral2" onPress={onClose} />
          </Flex>
        ) : undefined}
        <Flex fill {...containerProps}>
          <NftsList
            renderedInModal={renderedInBottomSheet}
            owner={address}
            renderNFTItem={renderNFT}
            contentContainerStyle={{
              paddingHorizontal: spacing.spacing12,
              paddingTop: spacing.spacing12,
              paddingBottom: renderedInBottomSheet ? insets.bottom + spacing.spacing12 : undefined,
            }}
            numColumns={numColumns}
          />
        </Flex>
      </Flex>
    </Modal>
  )
}
