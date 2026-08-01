import type { ProfileMetadata } from '@universe/api'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { unitagsApiClient } from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'
import { useInvalidateUnitagsQueries } from 'uniswap/src/data/apiClients/unitagsApi/useInvalidateUnitagsQueries'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { UnitagEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { tryUploadAvatar } from 'uniswap/src/features/unitags/avatars'
import { type MobileScreens, UnitagScreens } from 'uniswap/src/types/screens/mobile'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { logger } from 'utilities/src/logger/logger'
import { normalizeTwitterUsername } from 'utilities/src/primitives/string'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { useAvatarUploadCredsWithRefresh } from 'wallet/src/features/unitags/hooks/useAvatarUploadCredsWithRefresh'
import { isFieldEdited, isProfileMetadataEdited } from 'wallet/src/features/unitags/utils/profileMetadata'
import { useWalletSigners } from 'wallet/src/features/wallet/context'
import { useAccount } from 'wallet/src/features/wallet/hooks'
import { generateSignerFunc } from 'wallet/src/features/wallet/signing/utils'

interface UseEditUnitagProfileStateParams {
  address: string
  unitag: string
  entryPoint: EditUnitagProfileEntryPoint
  onNavigate?: () => void
  onSave?: () => void
}

export type EditUnitagProfileEntryPoint =
  | UnitagScreens.UnitagConfirmation
  | MobileScreens.SettingsWallet
  | UnitagScreens.EditProfile

interface UseEditUnitagProfileStateResult {
  loading: boolean
  unitagMetadata?: ProfileMetadata
  isSaving: boolean
  bioInput?: string
  twitterInput?: string
  avatarImageUri?: string
  setBioInput: (value: string) => void
  setAvatarImageUri: (value: string | undefined) => void
  setTwitterInput: (value: string) => void
  profileMetadataEdited: boolean
  onPressSaveChanges: () => Promise<void>
}

export function useEditUnitagProfileState({
  address,
  unitag,
  entryPoint,
  onNavigate,
  onSave,
}: UseEditUnitagProfileStateParams): UseEditUnitagProfileStateResult {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const account = useAccount(address)
  const signerManager = useWalletSigners()
  const invalidateUnitagsQueries = useInvalidateUnitagsQueries()

  const { data: retrievedUnitag, isLoading: loading } = useUnitagsAddressQuery({
    params: address ? { address } : undefined,
  })
  const unitagMetadata = retrievedUnitag?.metadata

  const { value: isSaving, setFalse: setIsNotSaving, setTrue: setIsSaving } = useBooleanState(false)

  const [isFormInitialized, setIsFormInitialized] = useState(false)
  const [twitterInput, setTwitterInputState] = useState(unitagMetadata?.twitter)
  const [avatarImageUri, setAvatarImageUri] = useState(unitagMetadata?.avatar)
  const [bioInput, setBioInput] = useState(unitagMetadata?.description)

  useEffect(() => {
    // Initialize editable fields once from fetched metadata.
    // After save, query updates can briefly emit stale metadata before fresh data;
    // avoid clobbering user-visible state by skipping subsequent syncs.
    if (!isFormInitialized && unitagMetadata) {
      setAvatarImageUri(unitagMetadata.avatar)
      setBioInput(unitagMetadata.description)
      setTwitterInputState(unitagMetadata.twitter)
      setIsFormInitialized(true)
    }
  }, [isFormInitialized, unitagMetadata])

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

  const profileMetadataEdited = isProfileMetadataEdited({
    loading: isSaving,
    updatedMetadata,
    initialMetadata: unitagMetadata,
  })

  const handleUpdateError = (): void => {
    dispatch(
      pushNotification({
        type: AppNotificationType.Error,
        errorMessage: t('unitags.notification.profile.error'),
      }),
    )
  }

  const updateProfileMetadata = async (uploadedNewAvatar: boolean): Promise<void> => {
    // If new avatar was uploaded, update metadata.avatar to be the S3 file location.
    // Add Date.now() to the end to ensure the resulting URL is not cached by devices.
    const newAvatarUrl = avatarUploadUrlResponse?.avatarUrl
      ? `${avatarUploadUrlResponse.avatarUrl}?${Date.now()}`
      : undefined
    const metadata = uploadedNewAvatar ? { ...updatedMetadata, avatar: newAvatarUrl } : updatedMetadata

    const updateResponse = await unitagsApiClient.updateUnitagMetadata({
      data: {
        username: unitag,
        metadata,
        clearAvatar: metadata.avatar === undefined,
      },
      address: account.address,
      signMessage: generateSignerFunc(account, signerManager),
    })

    if (!updateResponse.success) {
      handleUpdateError()
      return
    }

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
    invalidateUnitagsQueries()

    if (uploadedNewAvatar) {
      // Match the suffixed URL stored in metadata so the dirty-check doesn't keep the Save button enabled
      setAvatarImageUri(newAvatarUrl)
    }

    // If entered from claim flow confirmation screen, navigate back to home on update success
    if (entryPoint === UnitagScreens.UnitagConfirmation) {
      onNavigate?.()
    }

    // Tracks back button to re open the manage wallets modal
    onSave?.()
  }

  const onPressSaveChanges = async (): Promise<void> => {
    dismissNativeKeyboard()

    // Try to upload avatar or skip avatar upload if not needed
    setIsSaving()

    try {
      // Snapshot creds used for upload to avoid refresh races.
      const { success, skipped } = await tryUploadAvatar({
        avatarImageUri,
        avatarUploadUrlResponse,
        avatarUploadUrlLoading,
      })

      if (!success) {
        setIsNotSaving()
        handleUpdateError()
        return
      }

      await updateProfileMetadata(!skipped)
    } catch (e) {
      logger.error(e, {
        tags: {
          file: 'useEditUnitagProfileState',
          function: 'onPressSaveChanges',
        },
      })
      handleUpdateError()
    } finally {
      // There's a bug with `unitagMetadata` when the profile is saved where it comes in twice:
      // once as the an old cached value (for example, the bio description is one from 5-6 saves ago) then again as the correct state that was just updated
      // This is a workaround to wait; otherwise, when tapped, the button will load > flash like it's enabled > then end in a disabled
      setTimeout(setIsNotSaving, 250)
    }
  }

  const setTwitterInput = (value: string): void => {
    setTwitterInputState(normalizeTwitterUsername(value))
  }

  return {
    loading,
    unitagMetadata,
    isSaving,
    bioInput,
    twitterInput,
    avatarImageUri,
    setBioInput,
    setAvatarImageUri,
    setTwitterInput,
    profileMetadataEdited,
    onPressSaveChanges,
  }
}
