import { SharedEventName } from '@uniswap/analytics-events'
import { OneSignal } from 'react-native-onesignal'
import { useDispatch } from 'react-redux'
import { OnboardingStackBaseParams, useOnboardingStackNavigation } from 'src/app/navigation/types'
import { OneSignalUserTagField } from 'src/features/notifications/constants'
import { initNotifsForNewUser } from 'src/features/notifications/slice'
import { MobileAppsFlyerEvents } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent, sendAppsFlyerEvent } from 'uniswap/src/features/telemetry/send'
import { OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { setAndroidCloudBackupEmail, setFinishedOnboarding } from 'wallet/src/features/wallet/slice'

/**
 * Bundles various actions that should be performed to complete onboarding.
 *
 * Used within the final screen of various onboarding flows.
 */
export function useCompleteOnboardingCallback({
  entryPoint,
  importType,
}: OnboardingStackBaseParams): () => Promise<void> {
  const dispatch = useDispatch()
  const { getAllOnboardingAccounts, finishOnboarding, getAndroidBackupEmail } = useOnboardingContext()
  const navigation = useOnboardingStackNavigation()

  const onboardingAccounts = getAllOnboardingAccounts()
  const onboardingAddresses = onboardingAccounts.map((account) => account.address)
  const androidBackupEmail = getAndroidBackupEmail()

  return async () => {
    // Run all shared onboarding completion logic
    await finishOnboarding({ importType })

    // Initializes notification settings
    dispatch(initNotifsForNewUser())
    OneSignal.User.addTags({
      [OneSignalUserTagField.OnboardingWalletAddress]: onboardingAddresses[0] ?? '',
      [OneSignalUserTagField.OnboardingCompletedAt]: Math.floor(Date.now() / ONE_SECOND_MS).toString(),
      [OneSignalUserTagField.OnboardingImportType]: importType,
    })

    // Send appsflyer event for mobile attribution
    if (entryPoint === OnboardingEntryPoint.FreshInstallOrReplace) {
      sendAppsFlyerEvent(MobileAppsFlyerEvents.OnboardingCompleted, { importType }).catch((error) =>
        logger.debug('hooks', 'useCompleteOnboardingCallback', error),
      )
    }

    // Log TOS acceptance for new wallets after they are activated
    if (entryPoint === OnboardingEntryPoint.FreshInstallOrReplace) {
      onboardingAddresses.forEach((address: string) => {
        sendAnalyticsEvent(SharedEventName.TERMS_OF_SERVICE_ACCEPTED, { address })
      })
    }

    if (androidBackupEmail) {
      dispatch(setAndroidCloudBackupEmail({ email: androidBackupEmail }))
    }

    // Exit flow
    dispatch(setFinishedOnboarding({ finishedOnboarding: true }))
    if (entryPoint === OnboardingEntryPoint.Sidebar) {
      navigation.navigate(MobileScreens.Home)
    }
  }
}
