import { useCallback, useEffect, useState } from 'react'
import { TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'

interface UseTypedDataWarningConfirmationParams {
  isNonStandard: boolean
  riskLevel: TransactionRiskLevel
  confirmedRisk: boolean
  onConfirmRisk: (confirmed: boolean) => void
}

interface UseTypedDataWarningConfirmationReturn {
  confirmedNonStandard: boolean
  confirmedRiskWarning: boolean
  handleNonStandardConfirm: (confirmed: boolean) => void
  handleRiskConfirm: (confirmed: boolean) => void
}

/**
 * Custom hook to manage warning confirmations for typed data signatures
 * Merges non-standard warning and risk-based warning confirmations
 *
 * @param isNonStandard - Whether the typed data is non-standard (irregular)
 * @param riskLevel - The risk level from Blockaid scan
 * @param confirmedRisk - Current confirmation state from parent (for initialization/sync)
 * @param onConfirmRisk - Callback to notify parent of merged confirmation state
 * @returns State and callbacks for managing confirmations
 */
export function useTypedDataWarningConfirmation({
  isNonStandard,
  riskLevel,
  confirmedRisk,
  onConfirmRisk,
}: UseTypedDataWarningConfirmationParams): UseTypedDataWarningConfirmationReturn {
  // Track separate confirmations for non-standard warning and risk warning
  const [confirmedNonStandard, setConfirmedNonStandard] = useState(false)
  const [confirmedRiskWarning, setConfirmedRiskWarning] = useState(confirmedRisk)

  // Determine if risk warning needs confirmation (only for Critical risks)
  const needsRiskConfirmation = riskLevel === TransactionRiskLevel.Critical

  // Sync with parent's confirmedRisk state (for external resets)
  useEffect(() => {
    if (!confirmedRisk) {
      setConfirmedRiskWarning(false)
    }
  }, [confirmedRisk])

  // Merge confirmations: when non-standard, both warnings must be confirmed if applicable
  useEffect(() => {
    if (isNonStandard) {
      // For non-standard, we need both confirmations if there's a critical risk
      const allConfirmed = confirmedNonStandard && (!needsRiskConfirmation || confirmedRiskWarning)
      onConfirmRisk(allConfirmed)
    } else {
      // For standard typed data, just pass through the risk confirmation
      onConfirmRisk(confirmedRiskWarning)
    }
  }, [isNonStandard, confirmedNonStandard, confirmedRiskWarning, needsRiskConfirmation, onConfirmRisk])

  // Callback to handle non-standard warning confirmation
  const handleNonStandardConfirm = useCallback((confirmed: boolean) => {
    setConfirmedNonStandard(confirmed)
  }, [])

  // Callback to handle risk warning confirmation
  const handleRiskConfirm = useCallback((confirmed: boolean) => {
    setConfirmedRiskWarning(confirmed)
  }, [])

  return {
    confirmedNonStandard,
    confirmedRiskWarning,
    handleNonStandardConfirm,
    handleRiskConfirm,
  }
}
