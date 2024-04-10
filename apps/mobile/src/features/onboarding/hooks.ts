import { SharedEventName } from '@uniswap/analytics-events'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackBaseParams, useOnboardingStackNavigation } from 'src/app/navigation/types'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import {
  setHasSkippedUnitagPrompt,
  setHasViewedUniconV2IntroModal,
} from 'wallet/src/features/behaviorHistory/slice'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { ImportType, OnboardingEntryPoint } from 'wallet/src/features/onboarding/types'
import { useClaimUnitag } from 'wallet/src/features/unitags/hooks'
import { Account, BackupType } from 'wallet/src/features/wallet/accounts/types'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import { usePendingAccounts } from 'wallet/src/features/wallet/hooks'
import { setFinishedOnboarding } from 'wallet/src/features/wallet/slice'
import { sendWalletAnalyticsEvent, sendWalletAppsFlyerEvent } from 'wallet/src/telemetry'
import { WalletAppsFlyerEvents } from 'wallet/src/telemetry/constants'

export type OnboardingCompleteProps = OnboardingStackBaseParams

/**
 * Bundles various actions that should be performed to complete onboarding.
 *
 * Used within the final screen of various onboarding flows.
 */
export function useCompleteOnboardingCallback({
  entryPoint,
  importType,
  unitagClaim,
}: OnboardingStackBaseParams): () => Promise<void> {
  const dispatch = useAppDispatch()
  const pendingAccounts = usePendingAccounts()
  const pendingWalletAddresses = Object.keys(pendingAccounts)
  const parentTrace = useTrace()
  const navigation = useOnboardingStackNavigation()

  const unitagsFeatureFlagEnabled = useFeatureFlag(FEATURE_FLAGS.Unitags)
  const claimUnitag = useClaimUnitag()

  const uniconsV2Enabled = useFeatureFlag(FEATURE_FLAGS.UniconsV2)

  return async () => {
    sendMobileAnalyticsEvent(
      entryPoint === OnboardingEntryPoint.Sidebar
        ? MobileEventName.WalletAdded
        : MobileEventName.OnboardingCompleted,
      {
        wallet_type: importType,
        accounts_imported_count: pendingWalletAddresses.length,
        wallets_imported: pendingWalletAddresses,
        cloud_backup_used: Object.values(pendingAccounts).some((acc: Account) =>
          acc.backups?.includes(BackupType.Cloud)
        ),
        ...parentTrace,
      }
    )

    // Log TOS acceptance for new wallets before they are activated
    if (entryPoint === OnboardingEntryPoint.FreshInstallOrReplace) {
      pendingWalletAddresses.forEach((address: string) => {
        sendWalletAnalyticsEvent(SharedEventName.TERMS_OF_SERVICE_ACCEPTED, { address })
      })
    }

    // Claim unitag if there's a claim to process
    if (unitagClaim) {
      const { claimError } = await claimUnitag(unitagClaim, {
        source: 'onboarding',
        hasENSAddress: false,
      })
      if (claimError) {
        dispatch(
          pushNotification({
            type: AppNotificationType.Error,
            errorMessage: claimError,
          })
        )
      }
    }

    // Remove pending flag from all new accounts.
    dispatch(pendingAccountActions.trigger(PendingAccountActions.Activate))

    // Dismiss unitags prompt if:
    // - the feature was enabled
    // - the onboarding method prompts for unitags (create new)
    if (unitagsFeatureFlagEnabled && importType === ImportType.CreateNew) {
      dispatch(setHasSkippedUnitagPrompt(true))
    }

    if (uniconsV2Enabled) {
      // Don't show Unicon V2 intro modal to new users
      dispatch(setHasViewedUniconV2IntroModal(true))
    }

    // Exit flow
    dispatch(setFinishedOnboarding({ finishedOnboarding: true }))
    if (entryPoint === OnboardingEntryPoint.Sidebar) {
      navigation.navigate(Screens.Home)
    }

    if (entryPoint === OnboardingEntryPoint.FreshInstallOrReplace) {
      await sendWalletAppsFlyerEvent(WalletAppsFlyerEvents.OnboardingCompleted, { importType })
    }
  }
}
