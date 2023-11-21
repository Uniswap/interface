import { useNavigation } from '@react-navigation/native'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UnitagStackScreenProp } from 'src/app/navigation/types'
import { TextInput } from 'src/components/input/TextInput'
import { Screen } from 'src/components/layout/Screen'
import { ChoosePhotoOptionsModal } from 'src/components/unitags/ChoosePhotoOptionsModal'
import { ScreenRow } from 'src/components/unitags/ScreenRow'
import { UnitagProfilePicture } from 'src/components/unitags/UnitagProfilePicture'
import { UNITAG_SUFFIX } from 'src/features/unitags/constants'
import { UnitagScreens } from 'src/screens/Screens'
import { Button, Flex, Icons, Text, useDeviceInsets } from 'ui/src'
import { iconSizes, imageSizes } from 'ui/src/theme'
import { ChainId } from 'wallet/src/constants/chains'
import { useENS } from 'wallet/src/features/ens/useENS'
import { shortenAddress } from 'wallet/src/utils/addresses'

export function EditProfileScreen({
  route,
}: UnitagStackScreenProp<UnitagScreens.EditProfile>): JSX.Element {
  // TODO (MOB-1314): add backend call to get unitag from address
  const unitag = 'placeholder'

  const { address } = route.params
  const { name: ensName } = useENS(ChainId.Mainnet, address)
  const navigation = useNavigation()
  const insets = useDeviceInsets()
  const { t } = useTranslation()
  const [imageUri, setImageUri] = useState<string>()
  const [showModal, setShowModal] = useState(false)
  const [bio, setBio] = useState('')
  const [twitter, setTwitter] = useState('')

  const openModal = (): void => {
    setShowModal(true)
  }

  const onCloseModal = (): void => {
    setShowModal(false)
  }

  const onPressSaveChanges = (): void => {
    // TODO (MOB-2123): POST to unitags backend to update profile metadata
    navigation.goBack()
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
        <ScreenRow
          headingText={t('Edit profile')}
          tooltipButton={<Icons.TripleDots color="$neutral2" size={iconSizes.icon16} />}
        />
        <Flex fill justifyContent="space-between">
          <Flex gap="$spacing24" justifyContent="flex-start" py="$spacing24">
            <Flex pb="$spacing48">
              <Flex
                backgroundColor="$accentSoft"
                borderRadius="$rounded20"
                height={imageSizes.image100}
              />
              <Flex bottom={0} mx="$spacing16" position="absolute" width={imageSizes.image100}>
                <Flex>
                  <UnitagProfilePicture
                    address={address}
                    profilePictureUri={imageUri}
                    size={imageSizes.image100}
                  />
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
            </Flex>

            <Flex gap="$spacing4" px="$spacing16">
              <Text color="$neutral1" variant="heading2">
                {unitag}
                {UNITAG_SUFFIX}
              </Text>
              <Text color="$neutral2" variant="subheading2">
                {shortenAddress(address)}
              </Text>
            </Flex>
            <Flex gap="$spacing24" px="$spacing16">
              <Flex row justifyContent="flex-start">
                <Text color="$neutral2" flex={1} variant="subheading1">
                  Bio
                </Text>
                <TextInput
                  autoCorrect
                  multiline
                  flex={2}
                  fontFamily="$body"
                  fontSize="$small"
                  numberOfLines={6}
                  p="$none"
                  placeholder={t('Type a bio for your profile')}
                  placeholderTextColor="$neutral3"
                  textAlign="left"
                  value={bio}
                  onChangeText={setBio}
                />
              </Flex>
              <Flex row justifyContent="flex-start">
                <Text color="$neutral2" flex={1} variant="subheading1">
                  Twitter
                </Text>
                <TextInput
                  autoCorrect
                  multiline
                  flex={2}
                  fontFamily="$body"
                  fontSize="$small"
                  numberOfLines={6}
                  p="$none"
                  placeholder={t('Type your handle here')}
                  placeholderTextColor="$neutral3"
                  textAlign="left"
                  value={twitter}
                  onChangeText={setTwitter}
                />
              </Flex>
              {ensName && (
                <Flex row justifyContent="flex-start">
                  <Text color="$neutral2" flex={1} variant="subheading1">
                    ENS
                  </Text>
                  <Text color="$neutral2" flex={2} variant="body2">
                    {ensName}
                  </Text>
                </Flex>
              )}
            </Flex>
          </Flex>
          <Button size="large" theme="primary" onPress={onPressSaveChanges}>
            {t('Save changes')}
          </Button>
        </Flex>
      </Flex>
      {showModal && (
        <ChoosePhotoOptionsModal
          address={address}
          setPhotoUri={setImageUri}
          showRemoveOption={!!imageUri}
          onClose={onCloseModal}
        />
      )}
    </Screen>
  )
}
