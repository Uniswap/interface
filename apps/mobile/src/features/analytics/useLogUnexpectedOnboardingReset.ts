import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import {
  clearOnboardingTimestamp,
  getOnboardingTimestamp,
  setOnboardingTimestamp,
} from 'src/features/analytics/onboardingTimestamp'
import { logger } from 'utilities/src/logger/logger'
import { selectFinishedOnboarding } from 'wallet/src/features/wallet/selectors'

/**
 * Detects and logs when Redux onboarding state appears to have been unexpectedly reset.
 * Uses a timestamp stored outside Redux to detect mismatches.
 */
export function useLogUnexpectedOnboardingReset(): void {
  const finishedOnboarding = useSelector(selectFinishedOnboarding)

  useEffect(() => {
    const onboardedTimestamp = getOnboardingTimestamp()

    // User has not yet onboarded - nothing to check
    if (!onboardedTimestamp && !finishedOnboarding) {
      logger.debug(
        'useLogUnexpectedOnboardingReset.ts',
        'useLogUnexpectedOnboardingReset',
        'User has not yet onboarded',
      )
      return
    }

    // User is properly onboarded with matching timestamp
    if (onboardedTimestamp && finishedOnboarding) {
      logger.debug(
        'useLogUnexpectedOnboardingReset.ts',
        'useLogUnexpectedOnboardingReset',
        'User is properly onboarded',
      )
      return
    }

    // Existing user who onboarded before this feature was added - set the timestamp
    if (!onboardedTimestamp && finishedOnboarding) {
      logger.debug(
        'useLogUnexpectedOnboardingReset.ts',
        'useLogUnexpectedOnboardingReset',
        'No onboarding timestamp found for onboarded user. Setting it now.',
      )
      setOnboardingTimestamp()
      return
    }

    // Mismatch detected: timestamp exists but Redux says not onboarded
    // This indicates unexpected data loss in Redux
    if (onboardedTimestamp && !finishedOnboarding) {
      const timeSinceOnboarding = Date.now() - onboardedTimestamp
      logger.error(new Error('Unexpected onboarding state reset detected in redux store data'), {
        tags: {
          file: 'useLogUnexpectedOnboardingReset.ts',
          function: 'useLogUnexpectedOnboardingReset',
        },
        extra: {
          onboardedTimestamp,
          timeSinceOnboardingMs: timeSinceOnboarding,
          reduxFinishedOnboarding: finishedOnboarding,
        },
      })
      // Clear timestamp to prevent repeated logging
      clearOnboardingTimestamp()
    }
  }, [finishedOnboarding])
}
