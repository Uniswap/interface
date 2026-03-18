import { useState } from 'react'
import { DappVerificationStatus } from 'wallet/src/features/dappRequests/types'

interface UseDappConnectionConfirmationParams {
  verificationStatus?: DappVerificationStatus
  isViewOnly: boolean
  isLoading?: boolean
}

interface UseDappConnectionConfirmationResult {
  confirmedWarning: boolean
  setConfirmedWarning: (confirmed: boolean) => void
  disableConfirm: boolean
}

/**
 * Pure function to determine if the confirm button should be disabled
 * @param verificationStatus - The verification status of the dapp
 * @param confirmedWarning - Whether the user has confirmed the warning
 * @param isViewOnly - Whether the account is view-only
 * @param isLoading - Whether a connection attempt is in progress
 * @returns True if the confirm button should be disabled
 */
export function shouldDisableConfirm({
  verificationStatus,
  confirmedWarning,
  isViewOnly,
  isLoading,
}: {
  verificationStatus: DappVerificationStatus | undefined
  confirmedWarning: boolean
  isViewOnly: boolean
  isLoading: boolean
}): boolean {
  const isThreat = verificationStatus === DappVerificationStatus.Threat
  return (isThreat && !confirmedWarning) || isViewOnly || isLoading
}
/**
 * Hook to manage dapp connection confirmation state and disable logic
 * @param params.verificationStatus - The verification status of the dapp
 * @param params.isViewOnly - Whether the account is view-only
 * @param params.isLoading - Whether a connection attempt is in progress
 * @returns Confirmation state and computed disable flag
 */
export function useDappConnectionConfirmation({
  verificationStatus,
  isViewOnly,
  isLoading = false,
}: UseDappConnectionConfirmationParams): UseDappConnectionConfirmationResult {
  const [confirmedWarning, setConfirmedWarning] = useState(false)

  const disableConfirm = shouldDisableConfirm({ verificationStatus, confirmedWarning, isViewOnly, isLoading })

  return {
    confirmedWarning,
    setConfirmedWarning,
    disableConfirm,
  }
}
