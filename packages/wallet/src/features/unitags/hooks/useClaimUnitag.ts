import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import { UnitagEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useUnitagUpdater } from 'uniswap/src/features/unitags/context'
import { UnitagClaim, UnitagClaimContext } from 'uniswap/src/features/unitags/types'
import { getUniqueId } from 'utilities/src/device/getUniqueId'
import { logger } from 'utilities/src/logger/logger'
import { useAsyncData } from 'utilities/src/react/hooks'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { claimUnitag } from 'wallet/src/features/unitags/api'
import { isLocalFileUri, uploadAndUpdateAvatarAfterClaim } from 'wallet/src/features/unitags/avatars'
import { parseUnitagErrorCode } from 'wallet/src/features/unitags/utils'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { useWalletSigners } from 'wallet/src/features/wallet/context'
import { useAccounts } from 'wallet/src/features/wallet/hooks'

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
