import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { navigate } from 'src/app/navigation/rootNavigation'
import { UnitagStackScreenProp } from 'src/app/navigation/types'
import { Screen } from 'src/components/layout/Screen'
import { ChoosePhotoOptionsModal } from 'src/components/unitags/ChoosePhotoOptionsModal'
import { ScreenRow } from 'src/components/unitags/ScreenRow'
import { UnitagProfilePicture } from 'src/components/unitags/UnitagProfilePicture'
import { OnboardingScreens, Screens, UnitagScreens } from 'src/screens/Screens'
import { Button, Flex, Icons, Text, useDeviceInsets } from 'ui/src'
import Unitag from 'ui/src/assets/icons/unitag.svg'
import { fonts, iconSizes, imageSizes } from 'ui/src/theme'
import { ImportType, OnboardingEntryPoint } from 'wallet/src/features/onboarding/types'
import { useActiveAccountAddress, usePendingAccounts } from 'wallet/src/features/wallet/hooks'

export function ChooseProfilePictureScreen({
  route,
}: UnitagStackScreenProp<UnitagScreens.ChooseProfilePicture>): JSX.Element {
  const { entryPoint, unitag } = route.params
  const activeAddress = useActiveAccountAddress()
  const pendingAccountAddress = Object.values(usePendingAccounts())?.[0]?.address
  const unitagAddress = activeAddress || pendingAccountAddress

  const insets = useDeviceInsets()
  const { t } = useTranslation()
  const [imageUri, setImageUri] = useState<string>()
  const [showModal, setShowModal] = useState(false)

  const openModal = (): void => {
    setShowModal(true)
  }

  const onCloseModal = (): void => {
    setShowModal(false)
  }

  const onPressFinish = (): void => {
    if (entryPoint === Screens.Home) {
      if (!activeAddress) {
        throw new Error('activeAddress should never be null when Unitag entryPoint is Home Screen')
      }
      navigate(Screens.UnitagStack, {
        screen: UnitagScreens.UnitagConfirmation,
        params: {
          unitag,
          address: activeAddress,
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
  }

  return (
    <Screen edges={['right', 'left']}>
      <Flex
        grow
        $short={{ gap: '$none' }}
        gap="$spacing16"
        pb="$spacing16"
        px="$spacing16"
        style={{ marginTop: insets.top, marginBottom: insets.bottom }}>
        <ScreenRow />
        <TitleRow />
        <Flex fill justifyContent="space-between">
          <Flex centered gap="$spacing24" py="$spacing24">
            <Flex>
              <Flex px="$spacing4" onPress={openModal}>
                <ProfilePicture address={unitagAddress} imageUri={imageUri} />
              </Flex>
              <Flex
                backgroundColor="$neutral1"
                borderRadius="$roundedFull"
                bottom={0}
                p="$spacing8"
                position="absolute"
                right={0}
                onPress={openModal}>
                <Icons.Edit color="$surface1" size={iconSizes.icon16} />
              </Flex>
            </Flex>
            <Flex row gap="$spacing8" px="$spacing24">
              <Text color="$neutral1" variant="heading2">
                {unitag}
              </Text>
              <Flex position="absolute" right={0}>
                <Unitag height={iconSizes.icon24} width={iconSizes.icon24} />
              </Flex>
            </Flex>
          </Flex>
          <Button size="medium" theme="primary" onPress={onPressFinish}>
            {entryPoint === Screens.Home ? t('Finish') : t('Create wallet')}
          </Button>
        </Flex>
      </Flex>
      {showModal && (
        <ChoosePhotoOptionsModal
          address={activeAddress}
          setPhotoUri={setImageUri}
          showRemoveOption={!!imageUri}
          onClose={onCloseModal}
        />
      )}
    </Screen>
  )
}

function TitleRow(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex centered gap="$spacing12" m="$spacing12">
      <Text
        $short={{ variant: 'subheading1' }}
        allowFontScaling={false}
        textAlign="center"
        variant="heading3">
        {t('Choose a profile photo')}
      </Text>
      <Text
        $short={{ variant: 'body3', maxFontSizeMultiplier: 1.1 }}
        color="$neutral2"
        maxFontSizeMultiplier={fonts.body2.maxFontSizeMultiplier}
        textAlign="center"
        variant="body2">
        {t('Upload your own or stick with your unique Unicon. You can always change this later.')}
      </Text>
    </Flex>
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
