import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { claimUnitag } from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'
import { SignMessageFunc } from 'uniswap/src/data/utils'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import { UnitagEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { isLocalFileUri, uploadAndUpdateAvatarAfterClaim } from 'uniswap/src/features/unitags/avatars.native'
import { useUnitagUpdater } from 'uniswap/src/features/unitags/context'
import { UnitagClaim, UnitagClaimContext } from 'uniswap/src/features/unitags/types'
import { parseUnitagErrorCode } from 'uniswap/src/features/unitags/utils'
import { getUniqueId } from 'utilities/src/device/getUniqueId'
import { logger } from 'utilities/src/logger/logger'

/**
 * A custom async hook that handles the process of claiming a Unitag
 * Hook must be used inside the OnboardingContext
 */
export const useClaimUnitag = (): ((
  claim: UnitagClaim,
  context: UnitagClaimContext,
  address?: string,
  signMessage?: SignMessageFunc,
) => Promise<{ claimError?: string }>) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { triggerRefetchUnitags } = useUnitagUpdater()

  return async (claim: UnitagClaim, context: UnitagClaimContext, address?: string, signMessage?: SignMessageFunc) => {
    const deviceId = await getUniqueId()

    if (!claim.address || !deviceId || !signMessage || !address) {
      return { claimError: t('unitags.claim.error.default') }
    }

    try {
      const claimResponse = await claimUnitag({
        data: {
          username: claim.username,
          deviceId,
          metadata: {
            avatar: claim.avatarUri && isLocalFileUri(claim.avatarUri) ? undefined : claim.avatarUri,
          },
        },
        address,
        signMessage,
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
            address,
            signMessage,
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
