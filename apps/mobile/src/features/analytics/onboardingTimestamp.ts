import { MMKV } from 'react-native-mmkv'
import { logger } from 'utilities/src/logger/logger'

const storage = new MMKV({ id: 'onboarding-timestamp' })
const ONBOARDING_TIMESTAMP_KEY = 'onboardingCompletedTimestamp'

export function setOnboardingTimestamp(): void {
  try {
    storage.set(ONBOARDING_TIMESTAMP_KEY, Date.now())
  } catch (error) {
    logger.error(error, {
      tags: { file: 'onboardingTimestamp.ts', function: 'setOnboardingTimestamp' },
    })
  }
}

export function getOnboardingTimestamp(): number | undefined {
  try {
    const value = storage.getNumber(ONBOARDING_TIMESTAMP_KEY)
    return value && value !== 0 ? value : undefined
  } catch (error) {
    logger.error(error, {
      tags: { file: 'onboardingTimestamp.ts', function: 'getOnboardingTimestamp' },
    })
    return undefined
  }
}

export function clearOnboardingTimestamp(): void {
  try {
    storage.delete(ONBOARDING_TIMESTAMP_KEY)
  } catch (error) {
    logger.error(error, {
      tags: { file: 'onboardingTimestamp.ts', function: 'clearOnboardingTimestamp' },
    })
  }
}
