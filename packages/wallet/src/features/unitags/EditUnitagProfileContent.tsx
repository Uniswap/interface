import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import {
  Button,
  Flex,
  InputProps,
  LinearGradient,
  ScrollView,
  Text,
  getUniconColors,
  useExtractedColors,
  useIsDarkMode,
  useSporeColors,
} from 'ui/src'
import { Pen } from 'ui/src/components/icons'
import { borderRadii, fonts, iconSizes, imageSizes, spacing } from 'ui/src/theme'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { useENS } from 'uniswap/src/features/ens/useENS'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import { UnitagEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useUnitagUpdater } from 'uniswap/src/features/unitags/context'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import { ProfileMetadata } from 'uniswap/src/features/unitags/types'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { MobileScreens, UnitagScreens } from 'uniswap/src/types/screens/mobile'
import { shortenAddress } from 'uniswap/src/utils/addresses'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard'
import { logger } from 'utilities/src/logger/logger'
import { isExtension, isMobileApp } from 'utilities/src/platform'
import { normalizeTwitterUsername } from 'utilities/src/primitives/string'
import { DisplayNameText } from 'wallet/src/components/accounts/DisplayNameText'
import { useAvatarSelectionHandler } from 'wallet/src/features/unitags/AvatarSelection'
import { extensionNftModalProps } from 'wallet/src/features/unitags/ChooseNftModal'
import { ChoosePhotoOptionsModal } from 'wallet/src/features/unitags/ChoosePhotoOptionsModal'
import { HeaderRadial, solidHeaderProps } from 'wallet/src/features/unitags/HeaderRadial'
import { UnitagProfilePicture } from 'wallet/src/features/unitags/UnitagProfilePicture'
import { updateUnitagMetadata } from 'wallet/src/features/unitags/api'
import { tryUploadAvatar } from 'wallet/src/features/unitags/avatars'
import { useAvatarUploadCredsWithRefresh } from 'wallet/src/features/unitags/hooks'
import { useWalletSigners } from 'wallet/src/features/wallet/context'
import { useAccount } from 'wallet/src/features/wallet/hooks'
import { DisplayNameType } from 'wallet/src/features/wallet/types'

const BIO_TEXT_INPUT_LINES = 6
const PADDING_WIDTH = isExtension ? '$none' : '$spacing16'

const isProfileMetadataEdited = (
  loading: boolean,
  updatedMetadata: ProfileMetadata,
  initialMetadata?: ProfileMetadata,
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

export function EditUnitagProfileContent({
  address,
  unitag,
  entryPoint,
  onNavigate,
}: {
  address: string
  unitag: string
  entryPoint: UnitagScreens.UnitagConfirmation | MobileScreens.SettingsWallet | UnitagScreens.EditProfile
  onNavigate?: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const account = useAccount(address)
  const colors = useSporeColors()
  const signerManager = useWalletSigners()
  const dispatch = useDispatch()

  const { unitag: retrievedUnitag, loading } = useUnitagByAddress(address)
  const unitagMetadata = retrievedUnitag?.metadata

  const [twitterInput, setTwitterInput] = useState<string>()
  const [avatarImageUri, setAvatarImageUri] = useState<string>()
  const [updateResponseLoading, setUpdateResponseLoading] = useState(false)
  const [bioInput, setBioInput] = useState<string>()
  const [showAvatarModal, setShowAvatarModal] = useState(false)

  useEffect(() => {
    // Only want to set values on first time unitag loads, when we have not yet made the PUT request
    if (unitagMetadata) {
      setAvatarImageUri(unitagMetadata.avatar)
      setBioInput(unitagMetadata.description)
      setTwitterInput(unitagMetadata.twitter)
      setUpdateResponseLoading(false)
    }
  }, [unitagMetadata])

  const { triggerRefetchUnitags } = useUnitagUpdater()

  const { avatarUploadUrlResponse, avatarUploadUrlLoading } = useAvatarUploadCredsWithRefresh({
    unitag,
    account,
    signerManager,
  })

  const updatedMetadata: ProfileMetadata = {
    ...(avatarImageUri ? { avatar: avatarImageUri } : {}),
    description: bioInput,
    twitter: twitterInput,
  }

  const isDarkMode = useIsDarkMode()
  const { name: ensName } = useENS(UniverseChainId.Mainnet, address)
  const onSetTwitterInput = (input: string): void => {
    const normalizedInput = normalizeTwitterUsername(input)
    setTwitterInput(normalizedInput)
  }
  const profileMetadataEdited = isProfileMetadataEdited(updateResponseLoading, updatedMetadata, unitagMetadata)

  const { colors: avatarColors } = useExtractedColors(avatarImageUri)

  const { color: uniconColor } = getUniconColors(address, false)

  // Wait for avatar, then render avatar extracted colors or unicon colors if no avatar
  const fixedGradientColors = useMemo(() => {
    if (avatarImageUri && !avatarColors) {
      return [colors.surface1.val, colors.surface1.val]
    } else if (avatarImageUri && avatarColors && avatarColors.base) {
      return [avatarColors.base, avatarColors.base]
    } else {
      return [uniconColor, uniconColor]
    }
  }, [avatarImageUri, avatarColors, colors.surface1.val, uniconColor])

  const openAvatarModal = (): void => {
    dismissNativeKeyboard()
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
    dismissNativeKeyboard()

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
          avatar: avatarUploadUrlResponse?.avatarUrl ? avatarUploadUrlResponse.avatarUrl + `?${Date.now()}` : undefined,
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
    sendAnalyticsEvent(UnitagEventName.UnitagMetadataUpdated, {
      avatar: uploadedNewAvatar,
      description: isFieldEdited(unitagMetadata?.description, updatedMetadata.description),
      twitter: isFieldEdited(unitagMetadata?.twitter, updatedMetadata.twitter),
    })

    dispatch(
      pushNotification({
        type: AppNotificationType.Success,
        title: t('unitags.notification.profile.title'),
      }),
    )
    triggerRefetchUnitags()
    if (uploadedNewAvatar) {
      setAvatarImageUri(avatarUploadUrlResponse?.avatarUrl)
    }

    // If entered from claim flow confirmation screen, navigate back to home on update success
    if (entryPoint === UnitagScreens.UnitagConfirmation) {
      onNavigate?.()
    }
  }

  const handleUpdateError = (): void => {
    setUpdateResponseLoading(false)
    dispatch(
      pushNotification({
        type: AppNotificationType.Error,
        errorMessage: t('unitags.notification.profile.error'),
      }),
    )
  }

  const inputProps: InputProps = {
    blurOnSubmit: true,
    fontFamily: '$body',
    fontSize: '$medium',
    fontWeight: '300',
    p: '$none',
    placeholderTextColor: '$neutral3',
    returnKeyType: 'done',
    textAlign: 'left',
    borderRadius: isExtension ? 0 : undefined,
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={{ pb: '$spacing24' }}
        keyboardShouldPersistTaps="handled"
        px={isExtension ? undefined : '$spacing24'}
        showsVerticalScrollIndicator={false}
      >
        <Flex grow gap="$spacing36">
          <Flex fill justifyContent="space-between">
            <Flex pt={isExtension ? '$spacing48' : undefined} pb="$spacing48">
              {isMobileApp && (
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
                    style={{
                      borderRadius: borderRadii.rounded20,
                      flex: 1,
                      opacity: 0.2,
                    }}
                  />
                  {avatarImageUri && avatarColors?.primary ? (
                    <HeaderRadial borderRadius={spacing.spacing20} color={avatarColors.primary} {...solidHeaderProps} />
                  ) : null}
                </Flex>
              )}
              <Flex
                bottom={spacing.spacing16}
                cursor="pointer"
                mx={PADDING_WIDTH}
                position="absolute"
                onPress={avatarSelectionHandler}
              >
                <Flex backgroundColor="$surface1" borderRadius="$roundedFull">
                  <UnitagProfilePicture address={address} size={iconSizes.icon70} unitagAvatarUri={avatarImageUri} />
                </Flex>
                <Flex
                  backgroundColor="$surface1"
                  borderRadius="$roundedFull"
                  bottom={-spacing.spacing2}
                  p="$spacing2"
                  position="absolute"
                  right={-spacing.spacing2}
                >
                  <Flex backgroundColor={isDarkMode ? '$neutral3' : '$neutral2'} borderRadius="$roundedFull" p={6}>
                    <Pen color={isDarkMode ? '$neutral1' : '$surface1'} size={iconSizes.icon16} />
                  </Flex>
                </Flex>
              </Flex>
            </Flex>

            <Flex alignItems="flex-start" gap="$spacing2" pb="$spacing16" px={PADDING_WIDTH}>
              <DisplayNameText
                displayName={{ name: unitag, type: DisplayNameType.Unitag }}
                textProps={{ variant: 'heading3' }}
              />
              <Text color="$neutral2" variant="subheading2">
                {shortenAddress(address)}
              </Text>
            </Flex>

            <Flex row gap="$spacing24" px={PADDING_WIDTH} pt="$spacing16">
              <Flex flex={1} gap="$spacing24">
                <Text color="$neutral2" pt="$spacing4" variant="subheading1">
                  {t('unitags.profile.bio.label')}
                </Text>
                <Text color="$neutral2" variant="subheading1">
                  {t('unitags.profile.links.twitter')}
                </Text>
                {ensName && (
                  <Text color="$neutral2" variant="subheading1">
                    ENS
                  </Text>
                )}
              </Flex>
              <Flex flex={3} gap="$spacing24">
                {!loading ? (
                  <TextInput
                    autoCorrect
                    multiline={isMobileApp}
                    maxHeight={fonts.body1.lineHeight * BIO_TEXT_INPUT_LINES}
                    rows={BIO_TEXT_INPUT_LINES}
                    placeholder={t('unitags.profile.bio.placeholder')}
                    value={bioInput}
                    onChangeText={setBioInput}
                    {...inputProps}
                    pt="$spacing4"
                  />
                ) : null}
                {!loading ? (
                  <Flex row gap="$none">
                    <Text color="$neutral3">@</Text>
                    <TextInput
                      autoCapitalize="none"
                      autoComplete="off"
                      autoCorrect={false}
                      placeholder={t('unitags.editProfile.placeholder')}
                      value={twitterInput}
                      onChangeText={onSetTwitterInput}
                      {...inputProps}
                    />
                  </Flex>
                ) : null}
                {ensName && (
                  <Text color="$neutral2" variant="body2">
                    {ensName}
                  </Text>
                )}
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </ScrollView>
      <Button
        disabled={!profileMetadataEdited}
        mt="$spacing12"
        mx={isExtension ? undefined : '$spacing24'}
        size="medium"
        theme="primary"
        onPress={onPressSaveChanges}
      >
        {t('common.button.save')}
      </Button>
      {showAvatarModal && (
        <ChoosePhotoOptionsModal
          address={address}
          hasNFTs={hasNFTs}
          setPhotoUri={setAvatarImageUri}
          showRemoveOption={!!avatarImageUri}
          nftModalProps={isExtension ? extensionNftModalProps : undefined}
          onClose={onCloseAvatarModal}
        />
      )}
    </>
  )
}
