import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator } from 'react-native'
import { navigate } from 'src/app/navigation/rootNavigation'
import { UnitagEntryPoint, UnitagStackScreenProp } from 'src/app/navigation/types'
import { useAvatarSelectionHandler } from 'src/components/unitags/AvatarSelection'
import { ChoosePhotoOptionsModal } from 'src/components/unitags/ChoosePhotoOptionsModal'
import { UnitagProfilePicture } from 'src/components/unitags/UnitagProfilePicture'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { UnitagName } from 'src/features/unitags/UnitagName'
import { Button, Flex, Text, useIsDarkMode, useSporeColors } from 'ui/src'
import { Pen } from 'ui/src/components/icons'
import { fonts, iconSizes, imageSizes, spacing } from 'ui/src/theme'
import { UnitagClaimSource } from 'uniswap/src/features/unitags/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens, UnitagScreens } from 'uniswap/src/types/screens/mobile'
import { useENSName } from 'wallet/src/features/ens/api'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { useClaimUnitag } from 'wallet/src/features/unitags/hooks'

function convertEntryPointToAnalyticsSource(entryPoint: UnitagEntryPoint): UnitagClaimSource {
  switch (entryPoint) {
    case MobileScreens.Home:
      return 'home'
    case MobileScreens.Settings:
      return 'settings'
    case OnboardingScreens.Landing:
      return 'onboarding'
    default:
      throw new Error(`unhandled entryPoint for ChooseProfilePictureScreen: ${entryPoint}`)
  }
}

export function ChooseProfilePictureScreen({
  route,
}: UnitagStackScreenProp<UnitagScreens.ChooseProfilePicture>): JSX.Element {
  const { entryPoint, unitag, unitagFontSize, address } = route.params

  const { t } = useTranslation()
  const colors = useSporeColors()
  const { data: ensName } = useENSName(address, UniverseChainId.Mainnet)
  const claimUnitag = useClaimUnitag()
  const isDarkMode = useIsDarkMode()

  const [imageUri, setImageUri] = useState<string>()
  const [showModal, setShowModal] = useState(false)
  const [claimError, setClaimError] = useState<string>()
  const [isClaiming, setIsClaiming] = useState(false)

  const { addUnitagClaim } = useOnboardingContext()

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
      addUnitagClaim({ address, username: unitag, avatarUri: imageUri })
      // Handle case navigating from onboarding
      navigate(MobileScreens.OnboardingStack, {
        screen: OnboardingScreens.WelcomeWallet,
        params: {
          importType: ImportType.CreateNew,
          entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
        },
      })
    } else {
      return attemptClaimUnitag()
    }
  }

  const attemptClaimUnitag = async (): Promise<void> => {
    setIsClaiming(true)
    const source = convertEntryPointToAnalyticsSource(entryPoint)
    const { claimError: attemptClaimError } = await claimUnitag(
      {
        address,
        username: unitag,
        avatarUri: imageUri,
      },
      {
        source,
        hasENSAddress: !!ensName,
      },
    )
    setIsClaiming(false)
    setClaimError(attemptClaimError)

    // Navigate to confirmation screen when a claim has been made
    if (attemptClaimError === undefined) {
      navigate(MobileScreens.UnitagStack, {
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
      subtitle={t('unitags.onboarding.profile.subtitle')}
      title={t('unitags.onboarding.profile.title')}
    >
      <Flex centered gap="$spacing20" mt="$spacing24">
        <Flex mt="$spacing48" onPress={avatarSelectionHandler}>
          <Flex px="$spacing4">
            <ProfilePicture address={address} imageUri={imageUri} />
          </Flex>
          <Flex
            backgroundColor="$surface1"
            borderRadius="$roundedFull"
            bottom={-spacing.spacing2}
            p="$spacing4"
            position="absolute"
            right={-spacing.spacing2}
            testID={TestID.Edit}
          >
            <Flex backgroundColor={isDarkMode ? '$neutral3' : '$neutral2'} borderRadius="$roundedFull" p={8}>
              <Pen color={isDarkMode ? '$neutral1' : '$surface1'} size={iconSizes.icon16} />
            </Flex>
          </Flex>
        </Flex>
        <Flex row>
          <UnitagName fontSize={unitagFontSize} name={unitag} />
        </Flex>
        {!!claimError && (
          <Text color="$statusCritical" variant="body2">
            {claimError}
          </Text>
        )}
      </Flex>
      <Button
        disabled={!!claimError || isClaiming}
        size="medium"
        testID={TestID.Continue}
        theme="primary"
        onPress={onPressContinue}
      >
        {isClaiming ? (
          <Flex height={fonts.buttonLabel1.lineHeight}>
            <ActivityIndicator color={colors.sporeWhite.val} />
          </Flex>
        ) : (
          t('common.button.continue')
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

function ProfilePicture({ address, imageUri }: { address: Maybe<Address>; imageUri?: string }): JSX.Element {
  if (address) {
    return <UnitagProfilePicture address={address} size={imageSizes.image100} unitagAvatarUri={imageUri} />
  }
  return <Flex borderRadius="$roundedFull" height={imageSizes.image100} overflow="hidden" width={imageSizes.image100} />
}
