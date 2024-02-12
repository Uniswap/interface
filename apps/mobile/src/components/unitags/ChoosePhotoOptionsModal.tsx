import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageLibraryOptions, launchImageLibrary } from 'react-native-image-picker'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { ChooseNftModal } from 'src/components/unitags/ChooseNftModal'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { Button, Flex, Icons, Text, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'

// Selected image will be shrunk to max width/height
// URI will then be for an image of those dimensions
const IMAGE_OPTIONS: ImageLibraryOptions = {
  mediaType: 'photo',
  maxWidth: 500,
  maxHeight: 500,
  quality: 1, // best quality
  includeBase64: false,
  selectionLimit: 1,
}

type ChoosePhotoOptionsProps = {
  address: Maybe<Address>
  setPhotoUri: (uri?: string) => void
  onClose: () => void
  showRemoveOption: boolean
}

export const ChoosePhotoOptionsModal = ({
  address,
  setPhotoUri,
  onClose,
  showRemoveOption,
}: ChoosePhotoOptionsProps): JSX.Element => {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const [showNftsList, setShowNftsList] = useState(false)

  const onPressNftsList = (): void => {
    setShowNftsList(true)
  }

  const onCloseNftsList = (): void => {
    setShowNftsList(false)
    onClose()
  }

  const onRemovePhoto = (): void => {
    setPhotoUri(undefined)
  }

  const onPressCameraRoll = async (): Promise<void> => {
    const response = await launchImageLibrary(IMAGE_OPTIONS)
    if (!response.didCancel && !response.errorCode && response.assets) {
      setPhotoUri(response.assets[0]?.uri)
    }

    onClose()
  }

  const cameraRollOption = {
    key: `${ElementName.OpenCameraRoll}`,
    onPress: onPressCameraRoll,
    render: () => <ChoosePhotoOption type={PhotoAction.BrowseCameraRoll} />,
  }
  const nftsOption = {
    key: `${ElementName.OpenNftsList}`,
    onPress: onPressNftsList,
    render: () => <ChoosePhotoOption type={PhotoAction.BrowseNftsList} />,
  }
  const options = address ? [cameraRollOption, nftsOption] : [cameraRollOption]

  return (
    <>
      <BottomSheetModal
        isDismissible
        backgroundColor={colors.surface1.get()}
        hideHandlebar={false}
        name={ModalName.ChooseProfilePhoto}
        onClose={onClose}>
        <Flex centered gap="$spacing24" pt="$spacing8" px="$spacing24">
          <Flex gap="$spacing12" width="100%">
            {options.map((option) => (
              <Flex key={option.key} onPress={option.onPress}>
                {option.render()}
              </Flex>
            ))}
            {showRemoveOption && (
              <Flex onPress={onRemovePhoto}>
                <ChoosePhotoOption type={PhotoAction.RemovePhoto} />
              </Flex>
            )}
          </Flex>
          <Flex centered row>
            <Button
              fill
              backgroundColor="$surface1"
              color="$accent1"
              theme="secondary"
              onPress={onClose}>
              {t('Close')}
            </Button>
          </Flex>
        </Flex>
      </BottomSheetModal>
      {showNftsList && address && (
        <ChooseNftModal address={address} setPhotoUri={setPhotoUri} onClose={onCloseNftsList} />
      )}
    </>
  )
}

enum PhotoAction {
  BrowseCameraRoll = 'camera-roll',
  BrowseNftsList = 'nfts-list',
  RemovePhoto = 'remove-photo',
}

const ChoosePhotoOption = ({ type }: { type: PhotoAction }): JSX.Element => {
  const { t } = useTranslation()
  return (
    <Flex
      row
      alignItems="center"
      backgroundColor="$surface3"
      borderRadius="$rounded20"
      gap="$spacing16"
      justifyContent="flex-start"
      p="$spacing24">
      {type === PhotoAction.BrowseCameraRoll && (
        <Icons.Camera color="$neutral1" size={iconSizes.icon24} />
      )}
      {type === PhotoAction.BrowseNftsList && (
        <Icons.Photo color="$neutral1" size={iconSizes.icon24} />
      )}
      {type === PhotoAction.RemovePhoto && (
        <Icons.Trash color="$statusCritical" size={iconSizes.icon24} />
      )}
      <Flex shrink alignItems="flex-start">
        <Text
          color={type === PhotoAction.RemovePhoto ? '$statusCritical' : '$neutral1'}
          numberOfLines={1}
          variant="body1">
          {type === PhotoAction.BrowseCameraRoll && t('Choose from camera roll')}
          {type === PhotoAction.BrowseNftsList && t('Choose an NFT')}
          {type === PhotoAction.RemovePhoto && t('Remove profile picture')}
        </Text>
      </Flex>
    </Flex>
  )
}
