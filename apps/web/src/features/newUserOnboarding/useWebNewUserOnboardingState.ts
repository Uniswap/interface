import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import {
  type NewUserOnboardingState,
  useNewUserOnboardingState,
} from 'uniswap/src/features/onboarding/useNewUserOnboardingState'
import { useEmbeddedWalletBackupStatus } from '~/features/wallet/components/AccountDrawer/PasskeyMenu/hooks/useEmbeddedWalletBackupStatus'

export interface WebNewUserOnboardingState extends NewUserOnboardingState {
  isEmbeddedWallet: boolean
  /** `undefined` when the status can't be read without a passkey prompt. */
  hasBackupLogin: boolean | undefined
  /** Independent of `isReturningUser`, so returning users still see it. */
  showBackupNudge: boolean
}

export function useWebNewUserOnboardingState(): WebNewUserOnboardingState {
  const isNewUserUxEnabled = useFeatureFlag(FeatureFlags.NewUserUx)
  const state = useNewUserOnboardingState()
  const backup = useEmbeddedWalletBackupStatus()
  const isBackupLoading = isNewUserUxEnabled && backup.isLoading

  return {
    ...state,
    isLoading: state.isLoading || isBackupLoading,
    showOnboardingNudges: state.showOnboardingNudges && !isBackupLoading,
    isEmbeddedWallet: backup.isEmbeddedWallet,
    hasBackupLogin: backup.hasBackupLogin,
    showBackupNudge: isNewUserUxEnabled && backup.hasBackupLogin === false,
  }
}
