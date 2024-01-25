import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getUniqueId } from 'react-native-device-info'
import { navigate } from 'src/app/navigation/rootNavigation'
import { UnitagStackScreenProp } from 'src/app/navigation/types'
import { ChoosePhotoOptionsModal } from 'src/components/unitags/ChoosePhotoOptionsModal'
import { UnitagProfilePicture } from 'src/components/unitags/UnitagProfilePicture'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { isLocalFileUri, uploadAndUpdateAvatarAfterClaim } from 'src/features/unitags/avatars'
import { OnboardingScreens, Screens, UnitagScreens } from 'src/screens/Screens'
import { AnimatedFlex, Button, Flex, Icons, Text } from 'ui/src'
import Unitag from 'ui/src/assets/graphics/unitag.svg'
import { iconSizes, imageSizes, spacing } from 'ui/src/theme'
import { logger } from 'utilities/src/logger/logger'
import { useAsyncData } from 'utilities/src/react/hooks'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { ImportType, OnboardingEntryPoint } from 'wallet/src/features/onboarding/types'
import {
  useClaimUnitagMutation,
  useUnitagUpdateMetadataMutation,
} from 'wallet/src/features/unitags/api'
import { parseUnitagErrorCode } from 'wallet/src/features/unitags/utils'
import { useActiveAccountAddress, usePendingAccounts } from 'wallet/src/features/wallet/hooks'
import { useAppDispatch } from 'wallet/src/state'

export function ChooseProfilePictureScreen({
  route,
}: UnitagStackScreenProp<UnitagScreens.ChooseProfilePicture>): JSX.Element {
  const { entryPoint, unitag } = route.params
  const activeAddress = useActiveAccountAddress()
  const pendingAccountAddress = Object.values(usePendingAccounts())?.[0]?.address
  const unitagAddress = activeAddress || pendingAccountAddress

  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [imageUri, setImageUri] = useState<string>()
  const [showModal, setShowModal] = useState(false)
  const [claimError, setClaimError] = useState<string>()
  const [claimUnitag] = useClaimUnitagMutation()
  const [updateUnitagMetadata] = useUnitagUpdateMetadataMutation(unitag)
  const { data: deviceId } = useAsyncData(getUniqueId)

  const openModal = (): void => {
    setShowModal(true)
  }

  const onCloseModal = (): void => {
    setShowModal(false)
  }

  const onPressContinue = async (): Promise<void> => {
    if (!deviceId) {
      return // Should never hit this condition. Button is disabled if deviceId is undefined
    }

    // throw error if unitagAddress is falsey
    if (!unitagAddress) {
      const error = new Error('unitagAddress should never be null when claiming a unitag')
      logger.error(error, {
        tags: { file: 'ChooseProfilePictureScreen', function: 'onPressFinish' },
      })
      return
    }

    const { data: claimResponse } = await claimUnitag({
      address: unitagAddress,
      username: unitag,
      deviceId,
      metadata: {
        avatar: imageUri && isLocalFileUri(imageUri) ? undefined : imageUri,
      },
    })
    if (claimResponse?.data.errorCode) {
      setClaimError(parseUnitagErrorCode(t, unitag, claimResponse?.data.errorCode))
      return
    }

    if (claimResponse?.data.success) {
      await onClaimSuccess()
      return
    }
  }

  const onClaimSuccess = useCallback(async (): Promise<void> => {
    if (imageUri && isLocalFileUri(imageUri) && !!unitagAddress) {
      // unitagAddress should always be defined here otherwise onPressContinue would've thrown an error
      const { success: updateSuccess } = await uploadAndUpdateAvatarAfterClaim(
        unitag,
        unitagAddress,
        imageUri,
        updateUnitagMetadata
      )
      if (!updateSuccess) {
        dispatch(
          pushNotification({
            type: AppNotificationType.Error,
            errorMessage: t('Could not set avatar. Try again later.'),
          })
        )
      }
    }

    if (entryPoint === Screens.Home) {
      if (!unitagAddress) {
        const error = new Error(
          'unitagAddress should never be null when Unitag entryPoint is Home Screen'
        )
        logger.error(error, {
          tags: { file: 'ChooseProfilePictureScreen', function: 'onClaimSuccess' },
        })
        return
      }
      navigate(Screens.UnitagStack, {
        screen: UnitagScreens.UnitagConfirmation,
        params: {
          unitag,
          address: unitagAddress,
          profilePictureUri: imageUri,
        },
      })
    } else {
      // entryPoint === OnboardingScreens.Landing
      navigate(Screens.OnboardingStack, {
        screen: OnboardingScreens.QRAnimation,
        params: {
          importType: ImportType.CreateNew,
          entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
        },
      })
    }
  }, [dispatch, entryPoint, imageUri, t, unitag, unitagAddress, updateUnitagMetadata])

  return (
    <SafeKeyboardOnboardingScreen
      subtitle={t(
        'Upload your own or stick with your unique Unicon. You can always change this later.'
      )}
      title={t('Choose a profile photo')}>
      <Flex centered gap="$spacing20">
        <Flex onPress={openModal}>
          <Flex px="$spacing4">
            <ProfilePicture address={unitagAddress} imageUri={imageUri} />
          </Flex>
          <Flex
            bg="$surface1"
            borderRadius="$roundedFull"
            bottom={-spacing.spacing8}
            p="$spacing8"
            position="absolute"
            right={-spacing.spacing8}>
            <Flex bg="$neutral2" borderRadius="$roundedFull" p="$spacing8">
              <Icons.Edit color="$surface1" size={iconSizes.icon20} />
            </Flex>
          </Flex>
        </Flex>
        <AnimatedFlex
          row
          alignSelf="center"
          animation="lazy"
          // eslint-disable-next-line react-native/no-inline-styles
          enterStyle={{ o: 0 }}
          gap="$spacing20">
          <Text color="$neutral1" variant="heading2">
            {unitag}
          </Text>
          <Flex row position="absolute" right={-spacing.spacing8} top={-spacing.spacing8}>
            <Unitag height={iconSizes.icon24} width={iconSizes.icon24} />
          </Flex>
        </AnimatedFlex>
        {!!claimError && (
          <Text color="$statusCritical" variant="body2">
            {claimError}
          </Text>
        )}
      </Flex>
      <Button
        disabled={!deviceId || !!claimError}
        size="medium"
        theme="primary"
        onPress={onPressContinue}>
        {t('Continue')}
      </Button>
      {showModal && (
        <ChoosePhotoOptionsModal
          address={activeAddress}
          setPhotoUri={setImageUri}
          showRemoveOption={!!imageUri}
          onClose={onCloseModal}
        />
      )}
    </SafeKeyboardOnboardingScreen>
  )
}

function ProfilePicture({
  address,
  imageUri,
}: {
  address: Maybe<Address>
  imageUri?: string
}): JSX.Element {
  if (address) {
    return (
      <UnitagProfilePicture
        address={address}
        profilePictureUri={imageUri}
        size={imageSizes.image100}
      />
    )
  }
  return (
    <Flex
      borderRadius="$roundedFull"
      height={imageSizes.image100}
      overflow="hidden"
      width={imageSizes.image100}
    />
  )
}
