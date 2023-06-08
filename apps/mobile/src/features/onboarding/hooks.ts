import { useAppDispatch } from 'src/app/hooks'
import { useOnboardingStackNavigation } from 'src/app/navigation/types'
import { ImportType, OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { useTrace } from 'src/features/telemetry/hooks'
import { Screens } from 'src/screens/Screens'
import {
  pendingAccountActions,
  PendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import { usePendingAccounts } from 'wallet/src/features/wallet/hooks'
import { setFinishedOnboarding } from 'wallet/src/features/wallet/slice'

/**
 * Bundles various actions that should be performed to complete onboarding.
 *
 * Used within the final screen of various onboarding flows.
 */
export function useCompleteOnboardingCallback(
  entryPoint: OnboardingEntryPoint,
  importType: ImportType
): () => void {
  const dispatch = useAppDispatch()
  const pendingAccounts = usePendingAccounts()
  const parentTrace = useTrace()
  const navigation = useOnboardingStackNavigation()

  return () => {
    sendAnalyticsEvent(
      entryPoint === OnboardingEntryPoint.Sidebar
        ? MobileEventName.WalletAdded
        : MobileEventName.OnboardingCompleted,
      {
        wallet_type: importType,
        accounts_imported_count: Object.entries(pendingAccounts).length,
        wallets_imported: Object.keys(pendingAccounts),
        ...parentTrace,
      }
    )
    // Remove pending flag from all new accounts.
    dispatch(pendingAccountActions.trigger(PendingAccountActions.ACTIVATE))

    // Exit flow
    dispatch(setFinishedOnboarding({ finishedOnboarding: true }))
    if (entryPoint === OnboardingEntryPoint.Sidebar) {
      navigation.navigate(Screens.Home)
    }
  }
}
