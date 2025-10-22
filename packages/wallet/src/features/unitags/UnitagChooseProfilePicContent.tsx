import { UnitagClaimSource } from '@universe/api'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, TouchableArea, useIsDarkMode } from 'ui/src'
import { Pen } from 'ui/src/components/icons'
import { imageSizes, spacing } from 'ui/src/theme'
import { useENSName } from 'uniswap/src/features/ens/api'
import { useClaimUnitag } from 'uniswap/src/features/unitags/hooks/useClaimUnitag'
import { UnitagName } from 'uniswap/src/features/unitags/UnitagName'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ExtensionScreens } from 'uniswap/src/types/screens/extension'
import { MobileScreens, OnboardingScreens, UnitagEntryPoint } from 'uniswap/src/types/screens/mobile'
import { isMobileApp } from 'utilities/src/platform'
import { useAvatarSelectionHandler } from 'wallet/src/features/unitags/AvatarSelection'
import { ChoosePhotoOptionsModal, ChoosePhotoOptionsProps } from 'wallet/src/features/unitags/ChoosePhotoOptionsModal'
import { UnitagProfilePicture } from 'wallet/src/features/unitags/UnitagProfilePicture'
import { useWalletSigners } from 'wallet/src/features/wallet/context'
import { useAccounts } from 'wallet/src/features/wallet/hooks'
import { generateSignerFunc } from 'wallet/src/features/wallet/signing/utils'

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
  const { data: ensName } = useENSName(address)
  const claimUnitag = useClaimUnitag()
  const isDarkMode = useIsDarkMode()
  const accounts = useAccounts()
  const signerManager = useWalletSigners()
  const account = accounts[address]

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
    const { claimError: attemptClaimError } = await claimUnitag({
      claim: {
        address,
        username: unitag,
        avatarUri: imageUri,
      },
      context: {
        source,
        hasENSAddress: !!ensName,
      },
      signMessage: generateSignerFunc(account, signerManager),
    })
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
              <Pen color={isDarkMode ? '$neutral1' : '$surface1'} size="$icon.16" />
            </Flex>
          </Flex>
        </TouchableArea>
        <Flex row>
          {isMobileApp && <UnitagName animateText textProps={{ fontSize: unitagFontSize }} name={unitag} />}
        </Flex>
        {!!claimError && (
          <Text color="$statusCritical" variant="body2">
            {claimError}
          </Text>
        )}
      </Flex>
      {isMobileApp && <Flex fill />}
      <Flex row>
        <Button
          loading={isClaiming}
          testID={TestID.Continue}
          isDisabled={!!claimError || isClaiming}
          size="medium"
          variant="branded"
          onPress={onPressContinue}
        >
          {t('common.button.continue')}
        </Button>
      </Flex>

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
