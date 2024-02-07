import { useAppDispatch } from 'src/app/hooks'
import { useOnboardingStackNavigation } from 'src/app/navigation/types'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { ImportType, OnboardingEntryPoint } from 'wallet/src/features/onboarding/types'
import { Account, BackupType } from 'wallet/src/features/wallet/accounts/types'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import { usePendingAccounts } from 'wallet/src/features/wallet/hooks'
import {
  markAccountDismissedUnitagPrompt,
  setFinishedOnboarding,
} from 'wallet/src/features/wallet/slice'
import { sendWalletAppsFlyerEvent } from 'wallet/src/telemetry'
import { WalletAppsFlyerEvents } from 'wallet/src/telemetry/constants'

/**
 * Bundles various actions that should be performed to complete onboarding.
 *
 * Used within the final screen of various onboarding flows.
 */
export function useCompleteOnboardingCallback(
  entryPoint: OnboardingEntryPoint,
  importType: ImportType
): () => Promise<void> {
  const dispatch = useAppDispatch()
  const pendingAccounts = usePendingAccounts()
  const pendingWalletAddresses = Object.keys(pendingAccounts)
  const parentTrace = useTrace()
  const navigation = useOnboardingStackNavigation()
  const unitagsFeatureFlagEnabled = useFeatureFlag(FEATURE_FLAGS.Unitags)

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
    // Remove pending flag from all new accounts.
    dispatch(pendingAccountActions.trigger(PendingAccountActions.Activate))

    // Dismiss unitags prompt if:
    // - the feature was enabled
    // - the onboarding method prompts for unitags (create new or additional)
    if (
      unitagsFeatureFlagEnabled &&
      [ImportType.CreateNew, ImportType.CreateAdditional].includes(importType)
    ) {
      pendingWalletAddresses.forEach((address) => {
        dispatch(markAccountDismissedUnitagPrompt(address))
      })
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
