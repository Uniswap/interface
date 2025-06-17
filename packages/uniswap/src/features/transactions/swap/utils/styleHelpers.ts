import { ColorTokens } from 'ui/src'
import { SLIPPAGE_CRITICAL_TOLERANCE } from 'uniswap/src/constants/transactions'

export function getSlippageWarningColor({
  customSlippageValue,
  autoSlippageTolerance,
  fallbackColorValue,
}: {
  customSlippageValue: number
  autoSlippageTolerance: number
  fallbackColorValue?: ColorTokens
}): ColorTokens {
  if (customSlippageValue >= SLIPPAGE_CRITICAL_TOLERANCE) {
    return '$statusCritical'
  }

  if (customSlippageValue > autoSlippageTolerance) {
    return '$statusWarning'
  }

  return fallbackColorValue ?? '$neutral2'
}
