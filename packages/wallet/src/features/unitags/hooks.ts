import { TFunction } from 'i18next'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useUnitagsAddressesQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { useUnitagsClaimEligibilityQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsClaimEligibilityQuery'
import { useUnitagsUsernameQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsUsernameQuery'
import { useENS } from 'uniswap/src/features/ens/useENS'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import { UnitagEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { AVATAR_UPLOAD_CREDS_EXPIRY_SECONDS, UNITAG_VALID_REGEX } from 'uniswap/src/features/unitags/constants'
import { useUnitagUpdater } from 'uniswap/src/features/unitags/context'
import {
  UnitagClaim,
  UnitagClaimContext,
  UnitagErrorCodes,
  UnitagGetAvatarUploadUrlResponse,
} from 'uniswap/src/features/unitags/types'
import { getUniqueId } from 'utilities/src/device/getUniqueId'
import { logger } from 'utilities/src/logger/logger'
import { useAsyncData } from 'utilities/src/react/hooks'
import { ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { claimUnitag, getUnitagAvatarUploadUrl } from 'wallet/src/features/unitags/api'
import { isLocalFileUri, uploadAndUpdateAvatarAfterClaim } from 'wallet/src/features/unitags/avatars'
import { parseUnitagErrorCode } from 'wallet/src/features/unitags/utils'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { useWalletSigners } from 'wallet/src/features/wallet/context'
import { useAccounts, useActiveAccountAddressWithThrow, useSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'

const MIN_UNITAG_LENGTH = 3
const MAX_UNITAG_LENGTH = 20

export const useCanActiveAddressClaimUnitag = (
  address?: Address,
): {
  canClaimUnitag: boolean
} => {
  const activeAddress = useActiveAccountAddressWithThrow()
  const targetAddress = address ?? activeAddress

  const { data: deviceId } = useAsyncData(getUniqueId)
  const { refetchUnitagsCounter } = useUnitagUpdater()
  const skip = !deviceId

  const { isLoading, data, refetch } = useUnitagsClaimEligibilityQuery({
    params: skip
      ? undefined
      : {
          address: targetAddress,
          deviceId,
        },
  })

  // Force refetch of canClaimUnitag if refetchUnitagsCounter changes
  useEffect(() => {
    if (skip || isLoading) {
      return
    }

    refetch().catch((error) =>
      logger.error(error, { tags: { file: 'unitags/hooks.ts', function: 'useCanActiveAddressClaimUnitag' } }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchUnitagsCounter])

  return {
    canClaimUnitag: !isLoading && !!data?.canClaim,
  }
}

export const useCanAddressClaimUnitag = (
  address?: Address,
  isUsernameChange?: boolean,
): { canClaimUnitag: boolean; errorCode?: UnitagErrorCodes } => {
  const { data: deviceId } = useAsyncData(getUniqueId)
  const { refetchUnitagsCounter } = useUnitagUpdater()
  const skip = !deviceId

  const { isLoading, data, refetch } = useUnitagsClaimEligibilityQuery({
    params: skip
      ? undefined
      : {
          address,
          deviceId,
          isUsernameChange,
        },
  })

  // Force refetch of canClaimUnitag if refetchUnitagsCounter changes
  useEffect(() => {
    if (skip || isLoading) {
      return
    }

    refetch().catch((error) =>
      logger.error(error, { tags: { file: 'unitags/hooks.ts', function: 'useCanAddressClaimUnitag' } }),
    )
    // Skip is included in the dependency array here bc of useAsyncData -- on mount deviceId is undefined so refetch would be skipped if not included
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchUnitagsCounter, skip])

  return {
    canClaimUnitag: !isLoading && !!data?.canClaim,
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

export const useCanClaimUnitagName = (unitag: string | undefined): { error: string | undefined; loading: boolean } => {
  const { t } = useTranslation()

  // Check for length and alphanumeric characters
  let error = unitag ? getUnitagFormatError(unitag, t) : undefined

  // Skip the backend calls if we found an error
  const unitagToSearch = error ? undefined : unitag
  const { isLoading: unitagLoading, data } = useUnitagsUsernameQuery({
    params: unitagToSearch ? { username: unitagToSearch } : undefined,
    staleTime: 2 * ONE_MINUTE_MS,
  })
  const { loading: ensLoading } = useENS({ nameOrAddress: unitagToSearch, autocompleteDomain: true })
  const loading = unitagLoading || ensLoading

  // Check for availability
  if (!loading && !!data && !data.available) {
    error = t('unitags.claim.error.unavailable')
  }
  return { error, loading }
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

  const { getOnboardingAccount } = useOnboardingContext()
  // If used outside of the context, this will return undefined and be ignored
  const onboardingAccount = getOnboardingAccount()

  return async (claim: UnitagClaim, context: UnitagClaimContext, account?: Account) => {
    if (!claim.address) {
      return { claimError: t('unitags.claim.error.default') }
    }

    const claimAccount = account || onboardingAccount || accounts[claim.address]

    if (!claimAccount || !deviceId) {
      return { claimError: t('unitags.claim.error.default') }
    }

    try {
      const { data: claimResponse } = await claimUnitag({
        username: claim.username,
        deviceId,
        metadata: {
          avatar: claim.avatarUri && isLocalFileUri(claim.avatarUri) ? undefined : claim.avatarUri,
        },
        account: claimAccount,
        signerManager,
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

export function useHasAnyAccountsWithUnitag(): boolean {
  const accounts = useSignerAccounts()
  const addresses = accounts.map((account) => account.address)

  const response = useUnitagsAddressesQuery({ params: { addresses } })

  return !!response.data?.usernames.length
}
