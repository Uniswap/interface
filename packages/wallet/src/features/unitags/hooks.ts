import { TFunction } from 'i18next'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getUniqueId } from 'react-native-device-info'
import { useDispatch } from 'react-redux'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { UnitagEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useUnitagQuery, useWaitlistPositionQuery } from 'uniswap/src/features/unitags/api'
import { useUnitagUpdater } from 'uniswap/src/features/unitags/context'
import {
  UnitagClaim,
  UnitagClaimContext,
  UnitagErrorCodes,
  UnitagGetAvatarUploadUrlResponse,
} from 'uniswap/src/features/unitags/types'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'
import { useAsyncData } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { getFirebaseAppCheckToken } from 'wallet/src/features/appCheck'
import { selectExtensionOnboardingState } from 'wallet/src/features/behaviorHistory/selectors'
import { ExtensionOnboardingState, setExtensionOnboardingState } from 'wallet/src/features/behaviorHistory/slice'
import { useENS } from 'wallet/src/features/ens/useENS'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { claimUnitag, getUnitagAvatarUploadUrl, useUnitagClaimEligibilityQuery } from 'wallet/src/features/unitags/api'
import { isLocalFileUri, uploadAndUpdateAvatarAfterClaim } from 'wallet/src/features/unitags/avatars'
import { AVATAR_UPLOAD_CREDS_EXPIRY_SECONDS, UNITAG_VALID_REGEX } from 'wallet/src/features/unitags/constants'
import { parseUnitagErrorCode } from 'wallet/src/features/unitags/utils'
import { Account, AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useWalletSigners } from 'wallet/src/features/wallet/context'
import { useAccounts, useActiveAccount, useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'
import { useAppSelector } from 'wallet/src/state'

const MIN_UNITAG_LENGTH = 3
const MAX_UNITAG_LENGTH = 20

export const useCanActiveAddressClaimUnitag = (): {
  canClaimUnitag: boolean
} => {
  const activeAddress = useActiveAccountAddressWithThrow()
  const { data: deviceId } = useAsyncData(getUniqueId)
  const { refetchUnitagsCounter } = useUnitagUpdater()
  const skip = !deviceId

  const { loading, data, refetch } = useUnitagClaimEligibilityQuery({
    address: activeAddress,
    deviceId: deviceId ?? '', // this is fine since we skip if deviceId is undefined
    skip,
  })

  // Force refetch of canClaimUnitag if refetchUnitagsCounter changes
  useEffect(() => {
    if (skip || loading) {
      return
    }

    refetch?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchUnitagsCounter])

  return {
    canClaimUnitag: !loading && !!data?.canClaim,
  }
}

export const useCanAddressClaimUnitag = (
  address?: Address,
  isUsernameChange?: boolean,
): { canClaimUnitag: boolean; errorCode?: UnitagErrorCodes } => {
  const { data: deviceId } = useAsyncData(getUniqueId)
  const { refetchUnitagsCounter } = useUnitagUpdater()
  const skip = !deviceId
  const { loading, data, refetch } = useUnitagClaimEligibilityQuery({
    address,
    deviceId: deviceId ?? '', // this is fine since we skip if deviceId is undefined
    isUsernameChange,
    skip,
  })

  // Force refetch of canClaimUnitag if refetchUnitagsCounter changes
  useEffect(() => {
    if (skip || loading) {
      return
    }

    refetch?.()
    // Skip is included in the dependency array here bc of useAsyncData -- on mount deviceId is undefined so refetch would be skipped if not included
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchUnitagsCounter, skip])

  return {
    canClaimUnitag: !loading && !!data?.canClaim,
    errorCode: data?.errorCode,
  }
}

// Helper function to enforce unitag length and alphanumeric characters
export const getUnitagFormatError = (unitag: string, t: TFunction): string | undefined => {
  if (unitag.length < MIN_UNITAG_LENGTH) {
    return t('unitags.username.error.min', {
      number: MIN_UNITAG_LENGTH,
    })
  } else if (unitag.length > MAX_UNITAG_LENGTH) {
    return t('unitags.username.error.max', {
      number: MAX_UNITAG_LENGTH,
    })
  } else if (unitag !== unitag.toLowerCase()) {
    return t('unitags.username.error.uppercase')
  } else if (!UNITAG_VALID_REGEX.test(unitag)) {
    return t('unitags.username.error.chars')
  }
  return undefined
}

export const useCanClaimUnitagName = (
  unitagAddress: Address | undefined,
  unitag: string | undefined,
): { error: string | undefined; loading: boolean; requiresENSMatch: boolean } => {
  const { t } = useTranslation()

  // Check for length and alphanumeric characters
  let error = unitag ? getUnitagFormatError(unitag, t) : undefined

  // Skip the backend calls if we found an error
  const unitagToSearch = error ? undefined : unitag
  const { loading: unitagLoading, data } = useUnitagQuery(unitagToSearch)
  const { loading: ensLoading, address: ensAddress } = useENS(UniverseChainId.Mainnet, unitagToSearch, true)
  const loading = unitagLoading || ensLoading

  // Check for availability and ENS match
  const dataLoaded = !loading && !!data
  const ensAddressMatchesUnitagAddress = areAddressesEqual(unitagAddress, ensAddress)
  if (dataLoaded && !data.available) {
    error = t('unitags.claim.error.unavailable')
  }
  if (dataLoaded && data.requiresEnsMatch && !ensAddressMatchesUnitagAddress) {
    error = t('unitags.claim.error.ensMismatch')
  }
  return { error, loading, requiresENSMatch: data?.requiresEnsMatch ?? false }
}

/**
 * A custom async hook that handles the process of claiming a Unitag
 * Hook must be used inside the OnboardingContext
 */
export const useClaimUnitag = (): ((
  claim: UnitagClaim,
  context: UnitagClaimContext,
  account?: Account,
) => Promise<{ claimError?: string }>) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { data: deviceId } = useAsyncData(getUniqueId)
  const accounts = useAccounts()
  const signerManager = useWalletSigners()
  const { triggerRefetchUnitags } = useUnitagUpdater()
  const unitagsDeviceAttestationEnabled = useFeatureFlag(FeatureFlags.UnitagsDeviceAttestation)

  const { getOnboardingAccount } = useOnboardingContext()
  // If used outside of the context, this will return undefined and be ignored
  const onboardingAccount = getOnboardingAccount()

  return async (claim: UnitagClaim, context: UnitagClaimContext, account?: Account) => {
    const claimAccount = account || onboardingAccount || accounts[claim.address]

    if (!claimAccount || !deviceId) {
      return { claimError: t('unitags.claim.error.default') }
    }

    try {
      let firebaseAppCheckToken
      if (unitagsDeviceAttestationEnabled) {
        firebaseAppCheckToken = await getFirebaseAppCheckToken()
        if (!firebaseAppCheckToken) {
          return { claimError: t('unitags.claim.error.appCheck') }
        }
      }

      const { data: claimResponse } = await claimUnitag({
        username: claim.username,
        deviceId,
        metadata: {
          avatar: claim.avatarUri && isLocalFileUri(claim.avatarUri) ? undefined : claim.avatarUri,
        },
        account: claimAccount,
        signerManager,
        firebaseAppCheckToken,
      })

      if (claimResponse.errorCode) {
        return { claimError: parseUnitagErrorCode(t, claim.username, claimResponse.errorCode) }
      }

      triggerRefetchUnitags()

      if (claimResponse.success) {
        // Log claim success
        sendAnalyticsEvent(UnitagEventName.UnitagClaimed, context)
        if (claim.avatarUri && isLocalFileUri(claim.avatarUri)) {
          const { success: uploadUpdateAvatarSuccess } = await uploadAndUpdateAvatarAfterClaim({
            username: claim.username,
            imageUri: claim.avatarUri,
            account: claimAccount,
            signerManager,
          })

          if (!uploadUpdateAvatarSuccess) {
            // Don't block claim flow if avatar upload fails, just dispatch a notification for the error
            dispatch(
              pushNotification({
                type: AppNotificationType.Error,
                errorMessage: t('unitags.claim.error.avatar'),
              }),
            )
          }
        }

        triggerRefetchUnitags()
      }

      // Return success (no error)
      return { claimError: undefined }
    } catch (e) {
      logger.error(e, { tags: { file: 'useClaimUnitag', function: 'claimUnitag' } })
      return { claimError: t('unitags.claim.error.default') }
    }
  }
}

export const useAvatarUploadCredsWithRefresh = ({
  unitag,
  account,
  signerManager,
}: {
  unitag: string
  account: Account
  signerManager: SignerManager
}): {
  avatarUploadUrlLoading: boolean
  avatarUploadUrlResponse?: UnitagGetAvatarUploadUrlResponse
} => {
  const [avatarUploadUrlLoading, setAvatarUploadUrlLoading] = useState(false)
  const [avatarUploadUrlResponse, setAvatarUploadUrlResponse] = useState<UnitagGetAvatarUploadUrlResponse>()

  // Re-fetch the avatar upload pre-signed URL every 110 seconds to ensure it's always fresh
  useEffect(() => {
    const fetchAvatarUploadUrl = async (): Promise<void> => {
      try {
        setAvatarUploadUrlLoading(true)
        const { data } = await getUnitagAvatarUploadUrl({
          username: unitag, // Assuming unitag is the username you're working with
          account,
          signerManager,
        })
        setAvatarUploadUrlResponse(data)
      } catch (e) {
        logger.error(e, {
          tags: { file: 'EditUnitagProfileScreen', function: 'fetchAvatarUploadUrl' },
        })
      } finally {
        setAvatarUploadUrlLoading(false)
      }
    }

    // Call immediately on component mount
    fetchAvatarUploadUrl().catch((e) => {
      logger.error(e, {
        tags: { file: 'EditUnitagProfileScreen', function: 'fetchAvatarUploadUrl' },
      })
    })

    // Set up the interval to refetch creds 10 seconds before expiry
    const intervalId = setInterval(fetchAvatarUploadUrl, (AVATAR_UPLOAD_CREDS_EXPIRY_SECONDS - 10) * ONE_SECOND_MS)

    // Clear the interval on component unmount
    return () => clearInterval(intervalId)
  }, [unitag, account, signerManager])

  return { avatarUploadUrlLoading, avatarUploadUrlResponse }
}

export const useShowExtensionPromoBanner = (): {
  error: string | undefined
  loading: boolean
  showExtensionPromoBanner: boolean
} => {
  const dispatch = useDispatch()
  const extensionOnboardingEnabledBeta = useFeatureFlag(FeatureFlags.ExtensionOnboarding)
  const extensionPromotionGAEnabled = useFeatureFlag(FeatureFlags.ExtensionPromotionGA)
  const extensionOnboardingState = useAppSelector(selectExtensionOnboardingState)
  const activeAccount = useActiveAccount()

  const skipBetaWaitlistQuery =
    extensionPromotionGAEnabled || // ignore waitlist if GA enabled
    !extensionOnboardingEnabledBeta ||
    extensionOnboardingState === ExtensionOnboardingState.Completed ||
    !activeAccount ||
    activeAccount.type !== AccountType.SignerMnemonic

  const { data, error, loading } = useWaitlistPositionQuery([activeAccount?.address || ''], skipBetaWaitlistQuery)

  /** Onboarding completed, skip all checks **/
  if (extensionOnboardingState === ExtensionOnboardingState.Completed) {
    return {
      error: undefined,
      loading: false,
      showExtensionPromoBanner: false,
    }
  }

  /*** GA checks first ***/
  if (extensionPromotionGAEnabled) {
    if (extensionOnboardingState === ExtensionOnboardingState.Undefined) {
      dispatch(setExtensionOnboardingState(ExtensionOnboardingState.ReadyToOnboard))
    }

    return {
      error: undefined,
      loading: false,
      showExtensionPromoBanner: true,
    }
  }

  /*** Skip beta checks if we didn't query for the data ***/
  if (skipBetaWaitlistQuery) {
    return {
      error: undefined,
      loading: false,
      showExtensionPromoBanner: false,
    }
  }

  const canOnboardToExtensionBeta = data?.isAccepted ?? false

  if (canOnboardToExtensionBeta && extensionOnboardingState === ExtensionOnboardingState.Undefined) {
    // Store the information locally so that we don't need to check again during onboarding
    dispatch(setExtensionOnboardingState(ExtensionOnboardingState.ReadyToOnboard))
  }

  return {
    error: error?.message,
    loading,
    showExtensionPromoBanner: canOnboardToExtensionBeta,
  }
}
