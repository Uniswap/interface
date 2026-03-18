import { ColorTokens } from 'ui/src'
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
