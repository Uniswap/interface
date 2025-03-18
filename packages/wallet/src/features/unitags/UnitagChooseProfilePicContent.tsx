import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator } from 'react-native'
import { DeprecatedButton, Flex, Text, TouchableArea, useIsDarkMode, useSporeColors } from 'ui/src'
import { Pen } from 'ui/src/components/icons'
import { fonts, iconSizes, imageSizes, spacing } from 'ui/src/theme'
import { useENSName } from 'uniswap/src/features/ens/api'
import { UnitagClaimSource } from 'uniswap/src/features/unitags/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ExtensionScreens } from 'uniswap/src/types/screens/extension'
import { MobileScreens, OnboardingScreens, UnitagEntryPoint } from 'uniswap/src/types/screens/mobile'
import { isMobileApp } from 'utilities/src/platform'
import { useAvatarSelectionHandler } from 'wallet/src/features/unitags/AvatarSelection'
import { ChoosePhotoOptionsModal, ChoosePhotoOptionsProps } from 'wallet/src/features/unitags/ChoosePhotoOptionsModal'
import { UnitagName } from 'wallet/src/features/unitags/UnitagName'
import { UnitagProfilePicture } from 'wallet/src/features/unitags/UnitagProfilePicture'
import { useClaimUnitag } from 'wallet/src/features/unitags/hooks'

function convertEntryPointToAnalyticsSource(entryPoint: UnitagEntryPoint): UnitagClaimSource {
  switch (entryPoint) {
    case ExtensionScreens.Home:
    // falls through
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

export function UnitagChooseProfilePicContent({
  address,
  unitag,
  shouldHandleClaim,
  entryPoint,
  unitagFontSize,
  nftModalProps,
  onContinue,
}: {
  address: Address
  unitag: string
  shouldHandleClaim: boolean
  entryPoint: UnitagEntryPoint
  unitagFontSize: number
  nftModalProps?: ChoosePhotoOptionsProps['nftModalProps']
  onContinue: (imageUri: string | undefined) => void
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { data: ensName } = useENSName(address)
  const claimUnitag = useClaimUnitag()
  const isDarkMode = useIsDarkMode()

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
    if (shouldHandleClaim) {
      await attemptClaimUnitag()
    } else {
      onContinue(imageUri)
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

    if (attemptClaimError === undefined) {
      onContinue(imageUri)
    }
  }

  return (
    <>
      <Flex centered gap="$spacing20" mt="$spacing24">
        <TouchableArea onPress={avatarSelectionHandler}>
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
        </TouchableArea>
        <Flex row>{isMobileApp && <UnitagName fontSize={unitagFontSize} name={unitag} />}</Flex>
        {!!claimError && (
          <Text color="$statusCritical" variant="body2">
            {claimError}
          </Text>
        )}
      </Flex>
      {isMobileApp && <Flex fill />}
      <DeprecatedButton
        isDisabled={!!claimError || isClaiming}
        size={entryPoint === OnboardingScreens.Landing ? 'large' : 'medium'}
        testID={TestID.Continue}
        theme="primary"
        onPress={onPressContinue}
      >
        {isClaiming ? (
          <Flex height={fonts.buttonLabel1.lineHeight}>
            <ActivityIndicator color={colors.white.val} />
          </Flex>
        ) : (
          t('common.button.continue')
        )}
      </DeprecatedButton>
      {showModal && (
        <ChoosePhotoOptionsModal
          address={address}
          hasNFTs={hasNFTs}
          nftModalProps={nftModalProps}
          showRemoveOption={!!imageUri}
          setPhotoUri={setImageUri}
          onClose={onCloseModal}
        />
      )}
    </>
  )
}

function ProfilePicture({ address, imageUri }: { address: Maybe<Address>; imageUri?: string }): JSX.Element {
  if (address) {
    return <UnitagProfilePicture address={address} size={imageSizes.image100} unitagAvatarUri={imageUri} />
  }
  return <Flex borderRadius="$roundedFull" height={imageSizes.image100} overflow="hidden" width={imageSizes.image100} />
}
