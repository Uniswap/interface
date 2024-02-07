import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator } from 'react-native'
import { getUniqueId } from 'react-native-device-info'
import { navigate } from 'src/app/navigation/rootNavigation'
import { UnitagStackScreenProp } from 'src/app/navigation/types'
import { ChoosePhotoOptionsModal } from 'src/components/unitags/ChoosePhotoOptionsModal'
import { UnitagProfilePicture } from 'src/components/unitags/UnitagProfilePicture'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { isLocalFileUri, uploadAndUpdateAvatarAfterClaim } from 'src/features/unitags/avatars'
import { OnboardingScreens, Screens, UnitagScreens } from 'src/screens/Screens'
import { AnimatedFlex, Button, Flex, Icons, Text, useSporeColors } from 'ui/src'
import Unitag from 'ui/src/assets/graphics/unitag.svg'
import { fonts, iconSizes, imageSizes, spacing } from 'ui/src/theme'
import { logger } from 'utilities/src/logger/logger'
import { useAsyncData } from 'utilities/src/react/hooks'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { ImportType, OnboardingEntryPoint } from 'wallet/src/features/onboarding/types'
import {
  useClaimUnitagMutation,
  useUnitagUpdateMetadataMutation,
} from 'wallet/src/features/unitags/api'
import { useUnitagUpdater } from 'wallet/src/features/unitags/context'
import { parseUnitagErrorCode } from 'wallet/src/features/unitags/utils'
import { useActiveAccountAddress, usePendingAccounts } from 'wallet/src/features/wallet/hooks'
import { useAppDispatch } from 'wallet/src/state'

export function ChooseProfilePictureScreen({
  route,
}: UnitagStackScreenProp<UnitagScreens.ChooseProfilePicture>): JSX.Element {
  const { entryPoint, unitag, importType } = route.params
  const activeAddress = useActiveAccountAddress()
  const pendingAccountAddress = Object.values(usePendingAccounts())?.[0]?.address
  const unitagAddress = activeAddress || pendingAccountAddress

  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const colors = useSporeColors()
  const { data: deviceId } = useAsyncData(getUniqueId)
  const { triggerRefetchUnitags } = useUnitagUpdater()

  const [imageUri, setImageUri] = useState<string>()
  const [showModal, setShowModal] = useState(false)
  const [claimError, setClaimError] = useState<string>()
  const [isClaiming, setIsClaiming] = useState(false)

  const [claimUnitag] = useClaimUnitagMutation()
  const [updateUnitagMetadata] = useUnitagUpdateMetadataMutation(unitag)

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

    setIsClaiming(true)

    try {
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
        setIsClaiming(false)
        return
      }

      if (claimResponse?.data.success) {
        await onClaimSuccess()
        return
      }
    } catch (e) {
      setIsClaiming(false)
      logger.error(e, { tags: { file: 'ChooseProfilePictureScreen', function: 'claimUnitag' } })
      dispatch(
        pushNotification({
          type: AppNotificationType.Error,
          errorMessage: t('Could not claim username. Try again later.'),
        })
      )
    }
  }

  const onClaimSuccess = useCallback(async (): Promise<void> => {
    if (imageUri && isLocalFileUri(imageUri) && !!unitagAddress) {
      // unitagAddress should always be defined here otherwise onPressContinue would've thrown an error
      const { success: uploadUpdateAvatarSuccess } = await uploadAndUpdateAvatarAfterClaim(
        unitag,
        unitagAddress,
        imageUri,
        updateUnitagMetadata
      )

      if (!uploadUpdateAvatarSuccess) {
        setIsClaiming(false)
        dispatch(
          pushNotification({
            type: AppNotificationType.Error,
            errorMessage: t('Could not set avatar. Try again later.'),
          })
        )
        return
      }
    }

    setIsClaiming(false)
    triggerRefetchUnitags()

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
    } else if (entryPoint === OnboardingScreens.Landing || importType === ImportType.CreateNew) {
      navigate(Screens.OnboardingStack, {
        screen: OnboardingScreens.WelcomeWallet,
        params: {
          importType: ImportType.CreateNew,
          entryPoint:
            OnboardingEntryPoint.Sidebar === entryPoint
              ? OnboardingEntryPoint.Sidebar
              : OnboardingEntryPoint.FreshInstallOrReplace,
        },
      })
    } else {
      // entryPoint === OnboardingEntryPoint.Sidebar and adding an additional wallet
      navigate(Screens.OnboardingStack, {
        screen: OnboardingScreens.Notifications,
        params: {
          importType: ImportType.CreateAdditional,
          entryPoint: OnboardingEntryPoint.Sidebar,
        },
      })
    }
  }, [
    dispatch,
    entryPoint,
    imageUri,
    importType,
    t,
    unitag,
    unitagAddress,
    updateUnitagMetadata,
    triggerRefetchUnitags,
  ])

  return (
    <SafeKeyboardOnboardingScreen
      subtitle={t(
        'Upload your own or stick with your unique Unicon. You can always change this later.'
      )}
      title={t('Choose a profile photo')}>
      <Flex centered gap="$spacing20" mt="$spacing48">
        <Flex onPress={openModal}>
          <Flex px="$spacing4">
            <ProfilePicture address={unitagAddress} imageUri={imageUri} />
          </Flex>
          <Flex
            bg="$surface1"
            borderRadius="$roundedFull"
            bottom={-spacing.spacing4}
            position="absolute"
            right={-spacing.spacing4}>
            <Flex
              bg="$neutral2"
              borderColor="$surface1"
              borderRadius="$roundedFull"
              borderWidth="$spacing4"
              p="$spacing8">
              <Icons.PencilDetailed color="$surface1" size={iconSizes.icon16} />
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
            <Unitag height={iconSizes.icon28} width={iconSizes.icon28} />
          </Flex>
        </AnimatedFlex>
        {!!claimError && (
          <Text color="$statusCritical" variant="body2">
            {claimError}
          </Text>
        )}
      </Flex>
      <Button
        disabled={!deviceId || !!claimError || isClaiming}
        size="medium"
        theme="primary"
        onPress={onPressContinue}>
        {isClaiming ? (
          <Flex height={fonts.buttonLabel1.lineHeight}>
            <ActivityIndicator color={colors.sporeWhite.val} />
          </Flex>
        ) : (
          t('Continue')
        )}
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
