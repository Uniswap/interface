import { isMobileApp, isWebPlatform } from '@universe/environment'
import { Flex, FlexCompatProps, SpaceTokens, spacing, Text, TouchableArea } from '@universe/mycelium'
import type { UniversalListStyle } from '@universe/mycelium'
import { X } from '@universe/mycelium/icons/X'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalProps } from 'uniswap/src/components/modals/ModalProps'
// This is intentionally imported from the native file as only the web app requires a web specific implementation
import { NftsList } from 'uniswap/src/components/nfts/NftsList.native'
import { NftView } from 'uniswap/src/components/nfts/NftView'
import { NftViewWithContextMenu } from 'uniswap/src/components/nfts/NftViewWithContextMenu'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import type { ChoosePhotoOptionsProps } from 'wallet/src/features/unitags/ChoosePhotoOptionsModal'
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
  containerProps?: FlexCompatProps
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

  const contentContainerStyle = useMemo<UniversalListStyle>(
    () => ({
      className: 'px-3 pt-3',
      style: renderedInBottomSheet ? { paddingBottom: insets.bottom + spacing.spacing12 } : undefined,
    }),
    [renderedInBottomSheet, insets.bottom],
  )

  return (
    <Modal
      overrideInnerContainer
      backgroundColor={colors.surface1.val}
      hideHandlebar={false}
      isDismissible={renderedInBottomSheet}
      name={ModalName.NftPicker}
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
            {/* position/left and onPress belong on the wrapper: mycelium icons don't carry
            layout-positioning or press-handler props on the SVG itself (INFRA-3320 style surface). */}
            <TouchableArea position="absolute" left={0} aria-label={t('common.button.close')} onPress={onClose}>
              <X size="$icon.24" color="$neutral2" />
            </TouchableArea>
          </Flex>
        ) : undefined}
        <Flex fill {...containerProps}>
          <NftsList
            renderedInModal={renderedInBottomSheet}
            owner={address}
            renderNFTItem={renderNFT}
            contentContainerStyle={contentContainerStyle}
            numColumns={numColumns}
          />
        </Flex>
      </Flex>
    </Modal>
  )
}
