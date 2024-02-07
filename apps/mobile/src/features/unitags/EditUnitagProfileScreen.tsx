import { isEqual } from 'lodash'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, KeyboardAvoidingView, StyleSheet } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { UnitagStackScreenProp } from 'src/app/navigation/types'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { ChangeUnitagModal } from 'src/components/unitags/ChangeUnitagModal'
import { ChoosePhotoOptionsModal } from 'src/components/unitags/ChoosePhotoOptionsModal'
import { DeleteUnitagModal } from 'src/components/unitags/DeleteUnitagModal'
import { UnitagProfilePicture } from 'src/components/unitags/UnitagProfilePicture'
import { HeaderRadial } from 'src/features/externalProfile/ProfileHeader'
import { tryUploadAvatar } from 'src/features/unitags/avatars'
import { Screens, UnitagScreens } from 'src/screens/Screens'
import {
  Button,
  Flex,
  Icons,
  LinearGradient,
  ScrollView,
  Text,
  useSporeColors,
  useUniconColors,
} from 'ui/src'
import { borderRadii, fonts, iconSizes, imageSizes, spacing } from 'ui/src/theme'
import { TextInput } from 'wallet/src/components/input/TextInput'
import { ChainId } from 'wallet/src/constants/chains'
import { useENS } from 'wallet/src/features/ens/useENS'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import {
  useUnitagGetAvatarUploadUrlQuery,
  useUnitagUpdateMetadataMutation,
} from 'wallet/src/features/unitags/api'
import { UNITAG_SUFFIX } from 'wallet/src/features/unitags/constants'
import { useUnitagUpdater } from 'wallet/src/features/unitags/context'
import { useUnitagByAddress } from 'wallet/src/features/unitags/hooks'
import { ProfileMetadata } from 'wallet/src/features/unitags/types'
import { useAppDispatch } from 'wallet/src/state'
import { shortenAddress } from 'wallet/src/utils/addresses'
import { useExtractedColors } from 'wallet/src/utils/colors'
import { isIOS } from 'wallet/src/utils/platform'

const BIO_TEXT_INPUT_LINES = 6

const isProfileMetadataEdited = (
  loading: boolean,
  updatedMetadata: ProfileMetadata,
  initialMetadata?: ProfileMetadata
): boolean => {
  return !loading && !isEqual(updatedMetadata, initialMetadata)
}

export function EditUnitagProfileScreen({
  route,
}: UnitagStackScreenProp<UnitagScreens.EditProfile>): JSX.Element {
  const { address, unitag, entryPoint } = route.params
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useAppDispatch()

  const { name: ensName } = useENS(ChainId.Mainnet, address)
  const { refetchUnitagsCounter } = useUnitagUpdater()
  const {
    unitag: retrievedUnitag,
    loading,
    refetch: refetchUnitagByAddress,
  } = useUnitagByAddress(address)
  const unitagMetadata = retrievedUnitag?.metadata

  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [avatarImageUri, setAvatarImageUri] = useState<string>()
  const [bioInput, setBioInput] = useState<string>()
  const [twitterInput, setTwitterInput] = useState<string>()
  const [showDeleteUnitagModal, setShowDeleteUnitagModal] = useState(false)
  const [showChangeUnitagModal, setShowChangeUnitagModal] = useState(false)

  const updatedMetadata: ProfileMetadata = {
    avatar: avatarImageUri,
    description: bioInput,
    twitter: twitterInput,
  }

  const [
    updateUnitagMetadata,
    { called: updateRequestMade, loading: updateResponseLoading, data: updateResponse },
  ] = useUnitagUpdateMetadataMutation(unitag)

  const { loading: avatarUploadUrlLoading, data: avatarUploadUrlResponse } =
    useUnitagGetAvatarUploadUrlQuery({ username: retrievedUnitag?.username })

  const profileMetadataEdited = isProfileMetadataEdited(
    updateResponseLoading,
    updatedMetadata,
    updateResponse?.metadata ?? unitagMetadata
  )

  // Force refetch of canClaimUnitag if refetchUnitagsCounter changes
  useEffect(() => {
    refetchUnitagByAddress?.()
  }, [refetchUnitagsCounter, refetchUnitagByAddress])

  useEffect(() => {
    // Only want to set values on first time unitag loads, when we have not yet made the PUT request
    if (!updateRequestMade && unitagMetadata) {
      setAvatarImageUri(unitagMetadata.avatar)
      setBioInput(unitagMetadata.description)
      setTwitterInput(unitagMetadata.twitter)
    }
  }, [updateRequestMade, unitagMetadata])

  const { colors: avatarColors } = useExtractedColors(avatarImageUri)
  const { gradientStart: uniconGradientStart, gradientEnd: uniconGradientEnd } =
    useUniconColors(address)

  // Wait for avatar, then render avatar extracted colors or unicon colors if no avatar
  const fixedGradientColors = useMemo(() => {
    if (avatarImageUri || (avatarImageUri && !avatarColors)) {
      return [colors.surface1.val, colors.surface1.val]
    }
    if (avatarImageUri && avatarColors && avatarColors.base) {
      return [avatarColors.base, avatarColors.base]
    }
    return [uniconGradientStart, uniconGradientEnd]
  }, [avatarColors, avatarImageUri, uniconGradientEnd, uniconGradientStart, colors.surface1.val])

  const openAvatarModal = (): void => {
    setShowAvatarModal(true)
  }

  const onCloseAvatarModal = (): void => {
    setShowAvatarModal(false)
  }

  const onPressSaveChanges = async (): Promise<void> => {
    Keyboard.dismiss()

    // Try to upload avatar or skip avatar upload if not needed
    const { success, skipped } = await tryUploadAvatar({
      avatarImageUri,
      avatarUploadUrlResponse,
      avatarUploadUrlLoading,
    })

    // Display error if avatar upload failed
    if (!success) {
      displayErrorNotification()
      return
    }

    try {
      const uploadedNewAvatar = success && !skipped
      await updateProfileMetadata(uploadedNewAvatar)
    } catch (e) {
      displayErrorNotification()
    }
  }

  const updateProfileMetadata = async (uploadedNewAvatar: boolean): Promise<void> => {
    // If new avatar was uploaded, update metadata.avatar to be the S3 file location
    const metadata = uploadedNewAvatar
      ? { ...updatedMetadata, avatar: avatarUploadUrlResponse?.avatarUrl }
      : updatedMetadata

    await updateUnitagMetadata({ address, metadata, clearAvatar: metadata.avatar === undefined })
    dispatch(
      pushNotification({
        type: AppNotificationType.Success,
        title: t('Profile updated'),
      })
    )

    if (uploadedNewAvatar) {
      setAvatarImageUri(avatarUploadUrlResponse?.avatarUrl)
    }
  }

  const displayErrorNotification = (): void => {
    dispatch(
      pushNotification({
        type: AppNotificationType.Error,
        errorMessage: t('Error updating profile. Please try again.'),
      })
    )
  }

  const menuActions = useMemo(() => {
    return [
      { title: t('Edit username'), systemIcon: 'pencil' },
      { title: t('Delete username'), systemIcon: 'trash', destructive: true },
    ]
  }, [t])

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={isIOS ? 'padding' : undefined}
        contentContainerStyle={styles.expand}
        // Disable the keyboard avoiding view when the modals are open, otherwise background elements will shift up when the user is editing their username
        enabled={!showDeleteUnitagModal && !showChangeUnitagModal}
        style={styles.base}>
        {/* Necessary to handle different header configuration when navigating from SettingsStack vs. UnitagsStack */}
        {entryPoint === Screens.SettingsWallet ? (
          <BackHeader
            alignment="center"
            endAdornment={
              <ContextMenu
                dropdownMenuMode
                actions={menuActions}
                onPress={(e): void => {
                  // Emitted index based on order of menu action array
                  // Edit username
                  if (e.nativeEvent.index === 0) {
                    setShowChangeUnitagModal(true)
                  }
                  // Delete username
                  if (e.nativeEvent.index === 1) {
                    setShowDeleteUnitagModal(true)
                  }
                }}>
                <Flex pr="$spacing8">
                  <Icons.TripleDots color="$neutral2" size={iconSizes.icon24} />
                </Flex>
              </ContextMenu>
            }
            p="$spacing16">
            <Text variant="body1">{t('Edit profile')}</Text>
          </BackHeader>
        ) : (
          <Flex bg="$surface1" pb="$spacing12" pt="$spacing20" px="$spacing24">
            <Text textAlign="center" variant="body1">
              {t('Edit profile')}
            </Text>
          </Flex>
        )}
        <ScrollView keyboardShouldPersistTaps="handled" px="$spacing24">
          <Flex grow gap="$spacing36">
            <Flex fill justifyContent="space-between">
              <Flex pb="$spacing48">
                <Flex height={imageSizes.image100}>
                  <Flex
                    bg="$surface1"
                    borderRadius="$rounded20"
                    bottom={0}
                    left={0}
                    position="absolute"
                    right={0}
                    top={0}
                  />
                  <LinearGradient
                    colors={fixedGradientColors}
                    end={{ x: 1, y: 1 }}
                    start={{ x: 0, y: 1 }}
                    style={styles.headerGradient}
                  />
                  {avatarImageUri && avatarColors?.primary ? (
                    <HeaderRadial borderRadius={spacing.spacing20} color={avatarColors.primary} />
                  ) : null}
                </Flex>
                <Flex
                  bottom={spacing.spacing16}
                  mx="$spacing16"
                  position="absolute"
                  onPress={openAvatarModal}>
                  <UnitagProfilePicture
                    address={address}
                    profilePictureUri={avatarImageUri}
                    size={imageSizes.image64}
                  />
                  <Flex
                    bg="$surface1"
                    borderRadius="$roundedFull"
                    bottom={-spacing.spacing4}
                    p="$spacing4"
                    position="absolute"
                    right={-spacing.spacing4}>
                    <Flex bg="$neutral2" borderRadius="$roundedFull" p="$spacing8">
                      <Icons.Edit color="$surface1" size={iconSizes.icon12} />
                    </Flex>
                  </Flex>
                </Flex>
              </Flex>

              <Flex gap="$spacing2" pb="$spacing16" px="$spacing16">
                <Text color="$neutral1" variant="heading3">
                  {unitag}
                  {UNITAG_SUFFIX}
                </Text>
                <Text color="$neutral2" variant="subheading2">
                  {shortenAddress(address)}
                </Text>
              </Flex>

              <Flex gap="$spacing24" px="$spacing16">
                <Flex row>
                  <Text color="$neutral2" flex={1} pt="$spacing4" variant="subheading1">
                    {t('Bio')}
                  </Text>
                  {!loading ? (
                    <TextInput
                      autoCorrect
                      blurOnSubmit
                      multiline
                      flex={2}
                      fontFamily="$body"
                      fontSize="$small"
                      maxHeight={fonts.body1.lineHeight * BIO_TEXT_INPUT_LINES}
                      numberOfLines={BIO_TEXT_INPUT_LINES}
                      p="$none"
                      placeholder={t('Type a bio for your profile')}
                      placeholderTextColor="$neutral3"
                      returnKeyType="done"
                      textAlign="left"
                      value={bioInput}
                      onChangeText={setBioInput}
                    />
                  ) : null}
                </Flex>
                <Flex row>
                  <Text color="$neutral2" flex={1} variant="subheading1">
                    {t('Twitter')}
                  </Text>
                  {!loading ? (
                    <TextInput
                      blurOnSubmit
                      autoCapitalize="none"
                      flex={2}
                      fontFamily="$body"
                      fontSize="$small"
                      p="$none"
                      placeholder={t('Type your handle here')}
                      placeholderTextColor="$neutral3"
                      returnKeyType="done"
                      textAlign="left"
                      value={twitterInput}
                      onChangeText={setTwitterInput}
                    />
                  ) : null}
                </Flex>
                {ensName && (
                  <Flex row>
                    <Text color="$neutral2" flex={1} variant="subheading1">
                      {t('ENS')}
                    </Text>
                    <Text color="$neutral2" flex={2} variant="body2">
                      {ensName}
                    </Text>
                  </Flex>
                )}
              </Flex>
            </Flex>
          </Flex>
        </ScrollView>
        <Button
          disabled={!profileMetadataEdited}
          mx="$spacing24"
          size="medium"
          theme="primary"
          onPress={onPressSaveChanges}>
          {t('Save')}
        </Button>
        {showAvatarModal && (
          <ChoosePhotoOptionsModal
            address={address}
            setPhotoUri={setAvatarImageUri}
            showRemoveOption={!!avatarImageUri}
            onClose={onCloseAvatarModal}
          />
        )}
      </KeyboardAvoidingView>
      {showDeleteUnitagModal && (
        <DeleteUnitagModal
          address={address}
          unitag={unitag}
          onClose={(): void => setShowDeleteUnitagModal(false)}
        />
      )}
      {showChangeUnitagModal && (
        <ChangeUnitagModal
          address={address}
          unitag={unitag}
          onClose={(): void => setShowChangeUnitagModal(false)}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  expand: {
    flexGrow: 1,
  },
  headerGradient: {
    borderRadius: borderRadii.rounded20,
    flex: 1,
    opacity: 0.2,
  },
})
