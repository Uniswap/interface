import { TFunction } from 'i18next'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getUniqueId } from 'react-native-device-info'
import { logger } from 'utilities/src/logger/logger'
import { useAsyncData } from 'utilities/src/react/hooks'
import { ChainId } from 'wallet/src/constants/chains'
import { useENS } from 'wallet/src/features/ens/useENS'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import {
  claimUnitag,
  useUnitagByAddressQuery,
  useUnitagClaimEligibilityQuery,
  useUnitagQuery,
} from 'wallet/src/features/unitags/api'
import {
  isLocalFileUri,
  uploadAndUpdateAvatarAfterClaim,
} from 'wallet/src/features/unitags/avatars'
import { UNITAG_VALID_REGEX } from 'wallet/src/features/unitags/constants'
import { useUnitagUpdater } from 'wallet/src/features/unitags/context'
import {
  UnitagAddressResponse,
  UnitagClaim,
  UnitagErrorCodes,
  UnitagUsernameResponse,
} from 'wallet/src/features/unitags/types'
import { parseUnitagErrorCode } from 'wallet/src/features/unitags/utils'
import { useWalletSigners } from 'wallet/src/features/wallet/context'
import {
  useAccounts,
  useActiveAccountAddressWithThrow,
  usePendingAccounts,
} from 'wallet/src/features/wallet/hooks'
import { areAddressesEqual } from 'wallet/src/utils/addresses'

const MIN_UNITAG_LENGTH = 3
const MAX_UNITAG_LENGTH = 20

export const useCanActiveAddressClaimUnitag = (): {
  canClaimUnitag: boolean
  refetch: (() => void) | undefined
} => {
  const unitagsFeatureFlagEnabled = useFeatureFlag(FEATURE_FLAGS.Unitags)
  const activeAddress = useActiveAccountAddressWithThrow()
  const { data: deviceId } = useAsyncData(getUniqueId)
  const { loading, data, refetch } = useUnitagClaimEligibilityQuery({
    address: activeAddress,
    deviceId: deviceId ?? '', // this is fine since we skip if deviceId is undefined
    skip: !unitagsFeatureFlagEnabled || !deviceId,
  })
  return { canClaimUnitag: !loading && !!data?.canClaim, refetch }
}

export const useCanAddressClaimUnitag = (
  address?: Address,
  isUsernameChange?: boolean
): { canClaimUnitag: boolean; errorCode?: UnitagErrorCodes; refetch: (() => void) | undefined } => {
  const unitagsFeatureFlagEnabled = useFeatureFlag(FEATURE_FLAGS.Unitags)
  const { data: deviceId } = useAsyncData(getUniqueId)
  const { loading, data, refetch } = useUnitagClaimEligibilityQuery({
    address,
    deviceId: deviceId ?? '', // this is fine since we skip if deviceId is undefined
    isUsernameChange,
    skip: !unitagsFeatureFlagEnabled || !deviceId,
  })
  return { canClaimUnitag: !loading && !!data?.canClaim, errorCode: data?.errorCode, refetch }
}

export const useUnitagByAddress = (
  address?: Address
): { unitag?: UnitagAddressResponse; loading: boolean } => {
  const unitagsFeatureFlagEnabled = useFeatureFlag(FEATURE_FLAGS.Unitags)
  const { data, loading, refetch } = useUnitagByAddressQuery(
    unitagsFeatureFlagEnabled ? address : undefined
  )

  // Force refetch if counter changes
  const { refetchUnitagsCounter } = useUnitagUpdater()
  useEffect(() => {
    refetch?.()
  }, [refetchUnitagsCounter, refetch])

  return { unitag: data, loading }
}

export const useUnitagByName = (
  name?: string
): { unitag?: UnitagUsernameResponse; loading: boolean } => {
  const unitagsFeatureFlagEnabled = useFeatureFlag(FEATURE_FLAGS.Unitags)
  const { data, loading, refetch } = useUnitagQuery(unitagsFeatureFlagEnabled ? name : undefined)

  // Force refetch if counter changes
  const { refetchUnitagsCounter } = useUnitagUpdater()
  useEffect(() => {
    refetch?.()
  }, [refetchUnitagsCounter, refetch])

  return { unitag: data, loading }
}

// Helper function to enforce unitag length and alphanumeric characters
export const getUnitagFormatError = (unitag: string, t: TFunction): string | undefined => {
  if (unitag.length < MIN_UNITAG_LENGTH) {
    return t(`Usernames must be at least {{ minUnitagLength }} characters`, {
      minUnitagLength: MIN_UNITAG_LENGTH,
    })
  } else if (unitag.length > MAX_UNITAG_LENGTH) {
    return t(`Usernames cannot be more than {{ maxUnitagLength }} characters`, {
      maxUnitagLength: MAX_UNITAG_LENGTH,
    })
  } else if (!UNITAG_VALID_REGEX.test(unitag)) {
    return t('Usernames can only contain lowercase letters and numbers')
  }
  return undefined
}

export const useCanClaimUnitagName = (
  unitagAddress: Address | undefined,
  unitag: string | undefined
): { error: string | undefined; loading: boolean } => {
  const { t } = useTranslation()

  // Check for length and alphanumeric characters
  let error = unitag ? getUnitagFormatError(unitag, t) : undefined

  // Skip the backend calls if we found an error
  const unitagToSearch = error ? undefined : unitag
  const { loading: unitagLoading, data } = useUnitagQuery(unitagToSearch)
  const { loading: ensLoading, address: ensAddress } = useENS(ChainId.Mainnet, unitagToSearch, true)
  const loading = unitagLoading || ensLoading

  // Check for availability and ENS match
  const dataLoaded = !loading && !!data
  const ensAddressMatchesUnitagAddress = areAddressesEqual(unitagAddress, ensAddress)
  if (dataLoaded && !data.available) {
    error = t('This username is not available')
  }
  if (dataLoaded && data.requiresEnsMatch && !ensAddressMatchesUnitagAddress) {
    error = t('To claim this username you must own the {{ unitag }}.eth ENS', { unitag })
  }
  return { error, loading }
}

export const useClaimUnitag = (): ((claim: UnitagClaim) => Promise<{ claimError?: string }>) => {
  const { t } = useTranslation()
  const { data: deviceId } = useAsyncData(getUniqueId)
  const accounts = useAccounts()
  const pendingAccounts = usePendingAccounts()
  const signerManager = useWalletSigners()
  const { triggerRefetchUnitags } = useUnitagUpdater()

  return async (claim: UnitagClaim) => {
    const claimAccount = pendingAccounts[claim.address] || accounts[claim.address]
    if (!claimAccount || !deviceId) {
      return { claimError: t('Could not claim username. Try again later.') }
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
        if (claim.avatarUri && isLocalFileUri(claim.avatarUri)) {
          const { success: uploadUpdateAvatarSuccess } = await uploadAndUpdateAvatarAfterClaim({
            username: claim.username,
            imageUri: claim.avatarUri,
            account: claimAccount,
            signerManager,
          })

          if (!uploadUpdateAvatarSuccess) {
            return { claimError: t('Could not set avatar. Try again later.') }
          }
        }

        triggerRefetchUnitags()
      }

      // Return success (no error)
      return { claimError: undefined }
    } catch (e) {
      logger.error(e, { tags: { file: 'useClaimUnitag', function: 'claimUnitag' } })
      return { claimError: t('Could not claim username. Try again later.') }
    }
  }
}
