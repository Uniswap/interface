/* eslint-disable max-lines */
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, KeyboardAvoidingView, StyleSheet } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { navigate } from 'src/app/navigation/rootNavigation'
import { UnitagStackScreenProp } from 'src/app/navigation/types'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { useAvatarSelectionHandler } from 'src/components/unitags/AvatarSelection'
import { ChangeUnitagModal } from 'src/components/unitags/ChangeUnitagModal'
import { ChoosePhotoOptionsModal } from 'src/components/unitags/ChoosePhotoOptionsModal'
import { DeleteUnitagModal } from 'src/components/unitags/DeleteUnitagModal'
import { UnitagProfilePicture } from 'src/components/unitags/UnitagProfilePicture'
import { HeaderRadial, solidHeaderProps } from 'src/features/externalProfile/ProfileHeader'
import { Screens, UnitagScreens } from 'src/screens/Screens'
import {
  Button,
  Flex,
  Icons,
  LinearGradient,
  ScrollView,
  Text,
  getUniconV2Colors,
  useIsDarkMode,
  useSporeColors,
  useUniconColors,
} from 'ui/src'
import { borderRadii, fonts, iconSizes, imageSizes, spacing } from 'ui/src/theme'
import { useUnitagUpdater } from 'uniswap/src/features/unitags/context'
import { ProfileMetadata } from 'uniswap/src/features/unitags/types'
import { isIOS } from 'uniswap/src/utils/platform'
import { logger } from 'utilities/src/logger/logger'
import { normalizeTwitterUsername } from 'utilities/src/primitives/string'
import { DisplayNameText } from 'wallet/src/components/accounts/DisplayNameText'
import { TextInput } from 'wallet/src/components/input/TextInput'
import { ChainId } from 'wallet/src/constants/chains'
import { useENS } from 'wallet/src/features/ens/useENS'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { updateUnitagMetadata } from 'wallet/src/features/unitags/api'
import { tryUploadAvatar } from 'wallet/src/features/unitags/avatars'
import {
  useAvatarUploadCredsWithRefresh,
  useUnitagByAddress,
} from 'wallet/src/features/unitags/hooks'
import { useWalletSigners } from 'wallet/src/features/wallet/context'
import { useAccount } from 'wallet/src/features/wallet/hooks'
import { DisplayNameType } from 'wallet/src/features/wallet/types'
import { useAppDispatch } from 'wallet/src/state'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'
import { UnitagEventName } from 'wallet/src/telemetry/constants'
import { shortenAddress } from 'wallet/src/utils/addresses'
import { useExtractedColors } from 'wallet/src/utils/colors'

const BIO_TEXT_INPUT_LINES = 6

const isProfileMetadataEdited = (
  loading: boolean,
  updatedMetadata: ProfileMetadata,
  initialMetadata?: ProfileMetadata
): boolean => {
  return (
    !loading &&
    (isFieldEdited(initialMetadata?.avatar, updatedMetadata.avatar) ||
      isFieldEdited(initialMetadata?.description, updatedMetadata.description) ||
      isFieldEdited(initialMetadata?.twitter, updatedMetadata.twitter))
  )
}

function isFieldEdited(a: string | undefined, b: string | undefined): boolean {
  const aNonValue = a === undefined || a === ''
  const bNonValue = b === undefined || b === ''

  if (aNonValue && bNonValue) {
    return false
  } else {
    return a !== b
  }
}

export function EditUnitagProfileScreen({
  route,
}: UnitagStackScreenProp<UnitagScreens.EditProfile>): JSX.Element {
  const { address, unitag, entryPoint } = route.params
  const { t } = useTranslation()
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()
  const dispatch = useAppDispatch()
  const account = useAccount(address)
  const signerManager = useWalletSigners()

  const { name: ensName } = useENS(ChainId.Mainnet, address)
  const { triggerRefetchUnitags } = useUnitagUpdater()
  const { unitag: retrievedUnitag, loading } = useUnitagByAddress(address)
  const unitagMetadata = retrievedUnitag?.metadata

  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [avatarImageUri, setAvatarImageUri] = useState<string>()
  const [bioInput, setBioInput] = useState<string>()
  const [twitterInput, setTwitterInput] = useState<string>()
  const [showDeleteUnitagModal, setShowDeleteUnitagModal] = useState(false)
  const [showChangeUnitagModal, setShowChangeUnitagModal] = useState(false)
  const [updateResponseLoading, setUpdateResponseLoading] = useState(false)
  const { avatarUploadUrlResponse, avatarUploadUrlLoading } = useAvatarUploadCredsWithRefresh({
    unitag,
    account,
    signerManager,
  })

  const onSetTwitterInput = (input: string): void => {
    const normalizedInput = normalizeTwitterUsername(input)
    setTwitterInput(normalizedInput)
  }

  const updatedMetadata: ProfileMetadata = {
    ...(avatarImageUri ? { avatar: avatarImageUri } : {}),
    description: bioInput,
    twitter: twitterInput,
  }

  const profileMetadataEdited = isProfileMetadataEdited(
    updateResponseLoading,
    updatedMetadata,
    unitagMetadata
  )

  useEffect(() => {
    // Only want to set values on first time unitag loads, when we have not yet made the PUT request
    if (unitagMetadata) {
      setAvatarImageUri(unitagMetadata.avatar)
      setBioInput(unitagMetadata.description)
      setTwitterInput(unitagMetadata.twitter)
      setUpdateResponseLoading(false)
    }
  }, [unitagMetadata])

  const { colors: avatarColors } = useExtractedColors(avatarImageUri)

  const uniconV1Colors = useUniconColors(address)
  const { color: uniconV2Color } = getUniconV2Colors(address)
  const isUniconsV2Enabled = useFeatureFlag(FEATURE_FLAGS.UniconsV2)
  const uniconColors = isUniconsV2Enabled
    ? { gradientStart: uniconV2Color, gradientEnd: uniconV2Color, glow: uniconV2Color }
    : uniconV1Colors

  const uniconGradientStart = uniconColors.gradientStart
  const uniconGradientEnd = uniconColors.gradientEnd

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
    Keyboard.dismiss()
    setShowAvatarModal(true)
  }

  const onCloseAvatarModal = (): void => {
    setShowAvatarModal(false)
  }

  const { avatarSelectionHandler, hasNFTs } = useAvatarSelectionHandler({
    address,
    avatarImageUri,
    setAvatarImageUri,
    showModal: openAvatarModal,
  })

  const onPressSaveChanges = async (): Promise<void> => {
    Keyboard.dismiss()

    // Try to upload avatar or skip avatar upload if not needed
    try {
      const { success, skipped } = await tryUploadAvatar({
        avatarImageUri,
        avatarUploadUrlResponse,
        avatarUploadUrlLoading,
      })

      // Display error if avatar upload failed
      if (!success) {
        handleUpdateError()
        return
      }

      const uploadedNewAvatar = success && !skipped
      await updateProfileMetadata(uploadedNewAvatar)
    } catch (e) {
      logger.error(e, {
        tags: { file: 'EditUnitagProfileScreen', function: 'onPressSaveChanges' },
      })
      handleUpdateError()
    }
  }

  const updateProfileMetadata = async (uploadedNewAvatar: boolean): Promise<void> => {
    // If new avatar was uploaded, update metadata.avatar to be the S3 file location
    const metadata = uploadedNewAvatar
      ? {
          ...updatedMetadata,
          // Add Date.now() to the end to ensure the resulting URL is not cached by devices
          avatar: avatarUploadUrlResponse?.avatarUrl
            ? avatarUploadUrlResponse.avatarUrl + `?${Date.now()}`
            : undefined,
        }
      : updatedMetadata

    setUpdateResponseLoading(true)
    const { data: updateResponse } = await updateUnitagMetadata({
      username: unitag,
      metadata,
      clearAvatar: metadata.avatar === undefined,
      account,
      signerManager,
    })

    if (!updateResponse.success) {
      handleUpdateError()
      return
    }

    // Log changed metadata
    sendWalletAnalyticsEvent(UnitagEventName.UnitagMetadataUpdated, {
      avatar: uploadedNewAvatar,
      description: isFieldEdited(unitagMetadata?.description, updatedMetadata.description),
      twitter: isFieldEdited(unitagMetadata?.twitter, updatedMetadata.twitter),
    })

    dispatch(
      pushNotification({
        type: AppNotificationType.Success,
        title: t('unitags.notification.profile.title'),
      })
    )
    triggerRefetchUnitags()
    if (uploadedNewAvatar) {
      setAvatarImageUri(avatarUploadUrlResponse?.avatarUrl)
    }

    // If entered from claim flow confirmation screen, navigate back to home on update success
    if (entryPoint === UnitagScreens.UnitagConfirmation) {
      navigate(Screens.Home)
    }
  }

  const handleUpdateError = (): void => {
    setUpdateResponseLoading(false)
    dispatch(
      pushNotification({
        type: AppNotificationType.Error,
        errorMessage: t('unitags.notification.profile.error'),
      })
    )
  }

  const menuActions = useMemo(() => {
    return [
      { title: t('unitags.profile.action.edit'), systemIcon: 'pencil' },
      { title: t('unitags.profile.action.delete'), systemIcon: 'trash', destructive: true },
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
        <BackHeader
          alignment="center"
          endAdornment={
            // Only show options to delete and edit username if editing from settings
            entryPoint === Screens.SettingsWallet ? (
              <ContextMenu
                dropdownMenuMode
                actions={menuActions}
                onPress={(e): void => {
                  Keyboard.dismiss()
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
            ) : undefined
          }
          p="$spacing16"
          onPressBack={
            // If entering from confirmation screen, back btn navigates to home
            entryPoint === UnitagScreens.UnitagConfirmation
              ? (): void => navigate(Screens.Home)
              : undefined
          }>
          <Text variant="body1">{t('settings.setting.wallet.action.editProfile')}</Text>
        </BackHeader>
        <ScrollView
          contentContainerStyle={{ pb: '$spacing24' }}
          keyboardShouldPersistTaps="handled"
          px="$spacing24"
          showsVerticalScrollIndicator={false}>
          <Flex grow gap="$spacing36">
            <Flex fill justifyContent="space-between">
              <Flex pb="$spacing48">
                <Flex height={imageSizes.image100}>
                  <Flex
                    backgroundColor="$surface1"
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
                    <HeaderRadial
                      borderRadius={spacing.spacing20}
                      color={avatarColors.primary}
                      {...solidHeaderProps}
                    />
                  ) : null}
                </Flex>
                <Flex
                  bottom={spacing.spacing16}
                  mx="$spacing16"
                  position="absolute"
                  onPress={avatarSelectionHandler}>
                  <Flex backgroundColor="$surface1" borderRadius="$roundedFull">
                    <UnitagProfilePicture
                      address={address}
                      size={iconSizes.icon70}
                      unitagAvatarUri={avatarImageUri}
                    />
                  </Flex>
                  <Flex
                    backgroundColor="$surface1"
                    borderRadius="$roundedFull"
                    bottom={-spacing.spacing2}
                    p="$spacing2"
                    position="absolute"
                    right={-spacing.spacing2}>
                    <Flex
                      backgroundColor={isDarkMode ? '$neutral3' : '$neutral2'}
                      borderRadius="$roundedFull"
                      p={6}>
                      <Icons.Pen
                        color={isDarkMode ? '$neutral1' : '$surface1'}
                        size={iconSizes.icon16}
                      />
                    </Flex>
                  </Flex>
                </Flex>
              </Flex>

              <Flex alignItems="flex-start" gap="$spacing2" pb="$spacing16" px="$spacing16">
                <DisplayNameText
                  displayName={{ name: unitag, type: DisplayNameType.Unitag }}
                  textProps={{ variant: 'heading3' }}
                />
                <Text color="$neutral2" variant="subheading2">
                  {shortenAddress(address)}
                </Text>
              </Flex>

              <Flex gap="$spacing24" px="$spacing16">
                <Flex row>
                  <Text color="$neutral2" flex={1} pt="$spacing4" variant="subheading1">
                    {t('unitags.profile.bio.label')}
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
                      placeholder={t('unitags.profile.bio.placeholder')}
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
                    {t('unitags.profile.links.twitter')}
                  </Text>
                  {!loading ? (
                    <Flex row flex={2} gap="$none">
                      <Text color="$neutral3">@</Text>
                      <TextInput
                        blurOnSubmit
                        autoCapitalize="none"
                        autoComplete="off"
                        autoCorrect={false}
                        fontFamily="$body"
                        fontSize="$small"
                        p="$none"
                        placeholder={t('unitags.editProfile.placeholder')}
                        placeholderTextColor="$neutral3"
                        returnKeyType="done"
                        textAlign="left"
                        value={twitterInput}
                        onChangeText={onSetTwitterInput}
                      />
                    </Flex>
                  ) : null}
                </Flex>
                {ensName && (
                  <Flex row>
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
          </Flex>
        </ScrollView>
        <Button
          disabled={!profileMetadataEdited}
          mb="$spacing12"
          mx="$spacing24"
          size="medium"
          theme="primary"
          onPress={onPressSaveChanges}>
          {t('common.button.save')}
        </Button>
        {showAvatarModal && (
          <ChoosePhotoOptionsModal
            address={address}
            hasNFTs={hasNFTs}
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
