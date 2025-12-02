import { ProfileMetadata } from '@universe/api'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import {
  Button,
  Flex,
  getUniconColors,
  InputProps,
  LinearGradient,
  ScrollView,
  Text,
  useExtractedColors,
  useIsDarkMode,
  useSporeColors,
} from 'ui/src'
import { Pen } from 'ui/src/components/icons'
import { borderRadii, fonts, iconSizes, imageSizes, spacing } from 'ui/src/theme'
import { DisplayNameText } from 'uniswap/src/components/accounts/DisplayNameText'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { UnitagsApiClient } from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'
import { useResetUnitagsQueries } from 'uniswap/src/data/apiClients/unitagsApi/useResetUnitagsQueries'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { DisplayNameType } from 'uniswap/src/features/accounts/types'
import { useENS } from 'uniswap/src/features/ens/useENS'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { UnitagEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { tryUploadAvatar } from 'uniswap/src/features/unitags/avatars'
import { MobileScreens, UnitagScreens } from 'uniswap/src/types/screens/mobile'
import { shortenAddress } from 'utilities/src/addresses'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { logger } from 'utilities/src/logger/logger'
import { isExtensionApp, isMobileApp } from 'utilities/src/platform'
import { normalizeTwitterUsername } from 'utilities/src/primitives/string'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { usePreviousWithLayoutEffect } from 'utilities/src/react/usePreviousWithLayoutEffect'
import { useAvatarSelectionHandler } from 'wallet/src/features/unitags/AvatarSelection'
import { extensionNftModalProps } from 'wallet/src/features/unitags/ChooseNftModal'
import { ChoosePhotoOptionsModal } from 'wallet/src/features/unitags/ChoosePhotoOptionsModal'
import { HeaderRadial, solidHeaderProps } from 'wallet/src/features/unitags/HeaderRadial'
import { useAvatarUploadCredsWithRefresh } from 'wallet/src/features/unitags/hooks/useAvatarUploadCredsWithRefresh'
import { UnitagProfilePicture } from 'wallet/src/features/unitags/UnitagProfilePicture'
import { useWalletSigners } from 'wallet/src/features/wallet/context'
import { useAccount } from 'wallet/src/features/wallet/hooks'
import { generateSignerFunc } from 'wallet/src/features/wallet/signing/utils'

const PADDING_WIDTH = isExtensionApp ? '$none' : '$spacing16'

function isProfileMetadataEdited({
  loading,
  updatedMetadata,
  initialMetadata,
}: {
  loading: boolean
  updatedMetadata: ProfileMetadata
  initialMetadata?: ProfileMetadata
}): boolean {
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
  }

  return a !== b
}

export function EditUnitagProfileContent({
  address,
  unitag,
  entryPoint,
  onNavigate,
  onButtonClick,
}: {
  address: string
  unitag: string
  entryPoint: UnitagScreens.UnitagConfirmation | MobileScreens.SettingsWallet | UnitagScreens.EditProfile
  onNavigate?: () => void
  onButtonClick?: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const account = useAccount(address)
  const colors = useSporeColors()
  const signerManager = useWalletSigners()
  const dispatch = useDispatch()

  const { data: retrievedUnitag, isLoading: loading } = useUnitagsAddressQuery({
    params: address ? { address } : undefined,
  })
  const unitagMetadata = retrievedUnitag?.metadata

  const { value: isSaving, setFalse: setIsNotSaving, setTrue: setIsSaving } = useBooleanState(false)

  // Set the state values to the unitag metadata values
  // We may have this if it's cached, which is persisted between sessions
  const [twitterInput, setTwitterInput] = useState(unitagMetadata?.twitter)
  const [avatarImageUri, setAvatarImageUri] = useState(unitagMetadata?.avatar)
  const [updateResponseLoading, setUpdateResponseLoading] = useState(false)
  const [bioInput, setBioInput] = useState(unitagMetadata?.description)

  const [showAvatarModal, setShowAvatarModal] = useState(false)

  const prevUnitagMetadata = usePreviousWithLayoutEffect(unitagMetadata)

  useEffect(() => {
    // Unfortunately, there's some race condition where when we save the unitag profile,
    // unitagMetadata comes in once as the previous state, then again as the updated state
    // So, we only want to call this effect when we just received unitag metadata
    // Otherwise, the state is set before the first render in each `useState` call
    const justGotMetadata = !prevUnitagMetadata && !!unitagMetadata

    if (justGotMetadata) {
      setAvatarImageUri(unitagMetadata.avatar)
      setBioInput(unitagMetadata.description)
      setTwitterInput(unitagMetadata.twitter)
      setUpdateResponseLoading(false)
    }
  }, [unitagMetadata, prevUnitagMetadata])

  const resetUnitagsQueries = useResetUnitagsQueries()

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
  const { name: ensName } = useENS({ nameOrAddress: address, autocompleteDomain: true })
  const onSetTwitterInput = (input: string): void => {
    const normalizedInput = normalizeTwitterUsername(input)
    setTwitterInput(normalizedInput)
  }

  const profileMetadataEdited = isProfileMetadataEdited({
    loading: updateResponseLoading || isSaving,
    updatedMetadata,
    initialMetadata: unitagMetadata,
  })

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
    setIsSaving()

    try {
      const { success, skipped } = await tryUploadAvatar({
        avatarImageUri,
        avatarUploadUrlResponse,
        avatarUploadUrlLoading,
      })

      // Display error if avatar upload failed
      if (!success) {
        setIsNotSaving()
        handleUpdateError()
        return
      }

      await updateProfileMetadata(!skipped)
    } catch (e) {
      logger.error(e, {
        tags: { file: 'EditUnitagProfileScreen', function: 'onPressSaveChanges' },
      })
      handleUpdateError()
    } finally {
      // There's a bug with `unitagMetadata` when the profile is saved where it comes in twice:
      // once as the an old cached value (for example, the bio description is one from 5-6 saves ago) then again as the correct state that was just updated
      // This is a workaround to wait; otherwise, when tapped, the button will load > flash like it's enabled > then end in a disabled
      setTimeout(setIsNotSaving, 250)
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
    const updateResponse = await UnitagsApiClient.updateUnitagMetadata({
      username: unitag,
      data: {
        metadata,
        clearAvatar: metadata.avatar === undefined,
      },
      address: account.address,
      signMessage: generateSignerFunc(account, signerManager),
    })

    setUpdateResponseLoading(false)

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
    resetUnitagsQueries()
    if (uploadedNewAvatar) {
      setAvatarImageUri(avatarUploadUrlResponse?.avatarUrl)
    }

    // If entered from claim flow confirmation screen, navigate back to home on update success
    if (entryPoint === UnitagScreens.UnitagConfirmation) {
      onNavigate?.()
    }

    // Tracks back button to re open the manage wallets modal
    onButtonClick?.()
  }

  const handleUpdateError = (): void => {
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
    borderRadius: isExtensionApp ? 0 : undefined,
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={{ pb: '$spacing24' }}
        keyboardShouldPersistTaps="handled"
        px={isExtensionApp ? undefined : '$spacing24'}
        showsVerticalScrollIndicator={false}
      >
        <Flex grow gap="$spacing36">
          <Flex fill justifyContent="space-between">
            <Flex pt={isExtensionApp ? '$spacing48' : undefined} pb="$spacing48">
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
                    <Pen color={isDarkMode ? '$neutral1' : '$surface1'} size="$icon.16" />
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
                {shortenAddress({ address })}
              </Text>
            </Flex>

            <Flex row gap="$spacing24" px={PADDING_WIDTH} pt="$spacing16">
              <Flex flex={1.5} gap="$spacing24">
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
              <Flex flex={2.5} gap="$spacing24">
                {!loading ? (
                  <TextInput
                    autoCorrect
                    height={fonts.subheading1.lineHeight}
                    placeholder={t('unitags.profile.bio.placeholder')}
                    value={bioInput}
                    verticalAlign="top"
                    onChangeText={setBioInput}
                    {...inputProps}
                    mt="$spacing4"
                  />
                ) : null}
                {!loading ? (
                  <Flex row gap="$none">
                    <Text color="$neutral3">@</Text>
                    <TextInput
                      autoCapitalize="none"
                      autoComplete="off"
                      autoCorrect={false}
                      height={fonts.subheading1.lineHeight}
                      placeholder={t('unitags.editProfile.placeholder')}
                      value={twitterInput}
                      verticalAlign="top"
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
        loading={isSaving}
        isDisabled={!profileMetadataEdited}
        mt="$spacing12"
        mx={isExtensionApp ? undefined : '$spacing24'}
        size="large"
        variant="branded"
        fill={false}
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
          nftModalProps={isExtensionApp ? extensionNftModalProps : undefined}
          onClose={onCloseAvatarModal}
        />
      )}
    </>
  )
}
