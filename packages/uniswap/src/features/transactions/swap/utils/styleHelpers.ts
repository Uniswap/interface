import { ColorTokens } from '@universe/mycelium'
import type { SlippageWarningLevel } from '@universe/transactions-ui'
import { SLIPPAGE_CRITICAL_TOLERANCE } from 'uniswap/src/constants/transactions'
import { SLIPPAGE_LOW_TOLERANCE_LP } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/SlippageLPWarning'

export function getSlippageWarningColor({
  customSlippageValue,
  autoSlippageTolerance,
  fallbackColorValue,
  warnLowSlippage,
}: {
  customSlippageValue: number
  autoSlippageTolerance: number
  fallbackColorValue?: ColorTokens
  warnLowSlippage?: boolean
}): ColorTokens {
  if (customSlippageValue >= SLIPPAGE_CRITICAL_TOLERANCE) {
    return '$statusCritical'
  }

  if (customSlippageValue > autoSlippageTolerance) {
    return '$statusWarning'
  }

  if (warnLowSlippage && customSlippageValue > 0 && customSlippageValue < SLIPPAGE_LOW_TOLERANCE_LP) {
    return '$statusWarning'
  }

  return fallbackColorValue ?? '$neutral2'
}

/** getSlippageWarningColor's comparisons as a level, for the transactions-ui slippage views. */
export function getSlippageWarningLevel({
  customSlippageValue,
  autoSlippageTolerance,
  warnLowSlippage,
}: {
  customSlippageValue: number
  autoSlippageTolerance: number
  warnLowSlippage?: boolean
}): SlippageWarningLevel | undefined {
  if (customSlippageValue >= SLIPPAGE_CRITICAL_TOLERANCE) {
    return 'critical'
  }

  if (customSlippageValue > autoSlippageTolerance) {
    return 'warning'
  }

  if (warnLowSlippage && customSlippageValue > 0 && customSlippageValue < SLIPPAGE_LOW_TOLERANCE_LP) {
    return 'warning'
  }

  return undefined
}
