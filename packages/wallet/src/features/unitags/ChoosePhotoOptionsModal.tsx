import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, useSporeColors } from 'ui/src'
import { Camera, PhotoStacked, Share, Trash } from 'ui/src/components/icons'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { isExtensionApp } from 'utilities/src/platform'
import { ChooseNftModal, ChooseNftModalProps } from 'wallet/src/features/unitags/ChooseNftModal'
import { selectPhotoFromLibrary } from 'wallet/src/features/unitags/photoSelection'

export type ChoosePhotoOptionsProps = {
  address: Maybe<Address>
  hasNFTs: boolean
  nftModalProps?: Omit<ChooseNftModalProps, 'address' | 'setPhotoUri' | 'onClose'>
  setPhotoUri: (uri?: string) => void
  onClose: () => void
  showRemoveOption: boolean
}

export const ChoosePhotoOptionsModal = ({
  address,
  hasNFTs,
  nftModalProps,
  setPhotoUri,
  onClose,
  showRemoveOption,
}: ChoosePhotoOptionsProps): JSX.Element => {
  const colors = useSporeColors()
  const [showNftsList, setShowNftsList] = useState(false)

  const onPressNftsList = async (): Promise<void> => {
    setShowNftsList(true)
  }

  const onCloseNftsList = (): void => {
    setShowNftsList(false)
    onClose()
  }

  const onRemovePhoto = async (): Promise<void> => {
    setPhotoUri(undefined)
    onClose()
  }

  const onPressCameraRoll = async (): Promise<void> => {
    const selectedPhoto = await selectPhotoFromLibrary()
    // Close needs to happen before setting the photo, otherwise the handler can get cut short
    onClose()
    if (selectedPhoto) {
      setPhotoUri(selectedPhoto)
    }
  }

  const options = [
    {
      item: (
        <ChoosePhotoOption
          key={ElementName.OpenCameraRoll}
          type={PhotoAction.BrowseCameraRoll}
          onPress={onPressCameraRoll}
        />
      ),
    },
  ]

  if (hasNFTs) {
    options.push({
      item: (
        <ChoosePhotoOption key={ElementName.OpenNftsList} type={PhotoAction.BrowseNftsList} onPress={onPressNftsList} />
      ),
    })
  }

  if (showRemoveOption) {
    options.push({
      item: <ChoosePhotoOption key={ElementName.Remove} type={PhotoAction.RemovePhoto} onPress={onRemovePhoto} />,
    })
  }

  return (
    <>
      <Modal
        isDismissible
        backgroundColor={colors.surface1.val}
        hideHandlebar={false}
        name={ModalName.ChooseProfilePhoto}
        onClose={onClose}
      >
        <Flex centered gap="$spacing24" pt="$spacing8" px="$spacing24">
          <Flex gap="$spacing12" width="100%">
            {options.map((option) => option.item)}
          </Flex>
        </Flex>
      </Modal>
      {showNftsList && address && (
        <ChooseNftModal address={address} setPhotoUri={setPhotoUri} onClose={onCloseNftsList} {...nftModalProps} />
      )}
    </>
  )
}

enum PhotoAction {
  BrowseCameraRoll = 'camera-roll',
  BrowseNftsList = 'nfts-list',
  RemovePhoto = 'remove-photo',
}

const ChoosePhotoOption = ({
  type,
  onPress,
}: {
  type: PhotoAction.BrowseCameraRoll | PhotoAction.BrowseNftsList | PhotoAction.RemovePhoto
  onPress: () => void
}): JSX.Element | null => {
  const { t } = useTranslation()

  const { buttonText, icon } = ((): {
    buttonText: string
    icon: JSX.Element
  } => {
    if (type === PhotoAction.BrowseCameraRoll) {
      return {
        buttonText: isExtensionApp
          ? t('unitags.choosePhoto.option.computer')
          : t('unitags.choosePhoto.option.cameraRoll'),
        icon: isExtensionApp ? <Share /> : <Camera />,
      }
    }

    if (type === PhotoAction.BrowseNftsList) {
      return {
        buttonText: t('unitags.choosePhoto.option.nft'),
        icon: <PhotoStacked />,
      }
    }

    // type === PhotoAction.RemovePhoto
    return {
      buttonText: t('unitags.choosePhoto.option.remove'),
      icon: <Trash />,
    }
  })()

  return (
    <Flex row>
      <Button
        icon={icon}
        size="large"
        variant={type === PhotoAction.RemovePhoto ? 'critical' : 'default'}
        emphasis="secondary"
        justifyContent="flex-start"
        onPress={onPress}
      >
        {buttonText}
      </Button>
    </Flex>
  )
}
