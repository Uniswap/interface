import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator } from 'react-native'
import { navigate } from 'src/app/navigation/rootNavigation'
import { UnitagStackScreenProp } from 'src/app/navigation/types'
import { useAvatarSelectionHandler } from 'src/components/unitags/AvatarSelection'
import { ChoosePhotoOptionsModal } from 'src/components/unitags/ChoosePhotoOptionsModal'
import { UnitagProfilePicture } from 'src/components/unitags/UnitagProfilePicture'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { OnboardingScreens, Screens, UnitagScreens } from 'src/screens/Screens'
import { AnimatedFlex, Button, Flex, Icons, Text, useSporeColors } from 'ui/src'
import { fonts, iconSizes, imageSizes, spacing } from 'ui/src/theme'
import { ImportType, OnboardingEntryPoint } from 'wallet/src/features/onboarding/types'
import { useClaimUnitag } from 'wallet/src/features/unitags/hooks'

export function ChooseProfilePictureScreen({
  route,
}: UnitagStackScreenProp<UnitagScreens.ChooseProfilePicture>): JSX.Element {
  const { entryPoint, unitag, address } = route.params

  const { t } = useTranslation()
  const colors = useSporeColors()
  const claimUnitag = useClaimUnitag()

  const [imageUri, setImageUri] = useState<string>()
  const [showModal, setShowModal] = useState(false)
  const [claimError, setClaimError] = useState<string>()
  const [isClaiming, setIsClaiming] = useState(false)

  const openModal = (): void => {
    setShowModal(true)
  }

  const onCloseModal = (): void => {
    setShowModal(false)
  }

  const { avatarSelectionHandler, hasNFTs } = useAvatarSelectionHandler({
    address,
    avatarImageUri: imageUri,
    setAvatarImageUri: setImageUri,
    showModal: openModal,
  })

  const onPressContinue = async (): Promise<void> => {
    if (entryPoint === OnboardingScreens.Landing) {
      // Handle case navigating from onboarding
      navigate(Screens.OnboardingStack, {
        screen: OnboardingScreens.WelcomeWallet,
        params: {
          importType: ImportType.CreateNew,
          entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
          unitagClaim: {
            address,
            username: unitag,
            avatarUri: imageUri,
          },
        },
      })
    } else {
      return attemptClaimUnitag()
    }
  }

  const attemptClaimUnitag = async (): Promise<void> => {
    setIsClaiming(true)
    const { claimError: attemptClaimError } = await claimUnitag({
      address,
      username: unitag,
      avatarUri: imageUri,
    })
    setIsClaiming(false)
    setClaimError(attemptClaimError)

    // Navigate to confirmation screen when a claim has been made
    if (attemptClaimError === undefined) {
      navigate(Screens.UnitagStack, {
        screen: UnitagScreens.UnitagConfirmation,
        params: {
          unitag,
          address,
          profilePictureUri: imageUri,
        },
      })
    }
  }

  return (
    <SafeKeyboardOnboardingScreen
      subtitle={t(
        'Upload your own or stick with your unique Unicon. You can always change this later.'
      )}
      title={t('Choose a profile photo')}>
      <Flex centered gap="$spacing20" mt="$spacing48">
        <Flex onPress={avatarSelectionHandler}>
          <Flex px="$spacing4">
            <ProfilePicture address={address} imageUri={imageUri} />
          </Flex>
          <Flex
            backgroundColor="$surface1"
            borderRadius="$roundedFull"
            bottom={-spacing.spacing4}
            position="absolute"
            right={-spacing.spacing4}>
            <Flex
              backgroundColor="$neutral2"
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
          enterStyle={{ opacity: 0 }}
          gap="$spacing20">
          <Text color="$neutral1" variant="heading2">
            {unitag}
          </Text>
          <Flex row position="absolute" right={-spacing.spacing8} top={-spacing.spacing8}>
            <Icons.Unitag size="$icon.28" />
          </Flex>
        </AnimatedFlex>
        {!!claimError && (
          <Text color="$statusCritical" variant="body2">
            {claimError}
          </Text>
        )}
      </Flex>
      <Button
        disabled={!!claimError || isClaiming}
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
          address={address}
          hasNFTs={hasNFTs}
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
