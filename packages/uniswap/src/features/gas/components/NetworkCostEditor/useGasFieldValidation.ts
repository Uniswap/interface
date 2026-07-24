import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export interface GasFieldValidationResult {
  maxBaseFee: { error?: string; warning?: string }
  priorityFee: { error?: string; warning?: string }
  gasLimit: { error?: string; warning?: string }
  /** True when no field has an error. Warnings do NOT block save. */
  canSave: boolean
}

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string

export function useGasFieldValidation(args: {
  values: { maxBaseFeeGwei?: string; priorityFeeGwei?: string; gasLimit?: string }
  recommended: {
    recommendedMaxBaseFeeGwei?: string
    recommendedPriorityFeeGwei?: string
    recommendedGasLimit?: string
    currentNetworkBaseFeeGwei?: string
  }
}): GasFieldValidationResult {
  const { t } = useTranslation()
  const { values, recommended } = args

  return useMemo(() => {
    const maxBaseFee = validateMaxBaseFee({
      input: values.maxBaseFeeGwei,
      currentBaseFee: recommended.currentNetworkBaseFeeGwei,
      t,
    })
    const priorityFee = validatePriorityFee({
      input: values.priorityFeeGwei,
      recommended: recommended.recommendedPriorityFeeGwei,
      t,
    })
    const gasLimit = validateGasLimit({
      input: values.gasLimit,
      recommended: recommended.recommendedGasLimit,
      t,
    })

    const canSave = !maxBaseFee.error && !priorityFee.error && !gasLimit.error
    return { maxBaseFee, priorityFee, gasLimit, canSave }
  }, [values, recommended, t])
}

function validateMaxBaseFee(args: { input?: string; currentBaseFee?: string; t: TranslateFn }): {
  error?: string
  warning?: string
} {
  const { input, currentBaseFee, t } = args
  // Empty input means "no override for this field" — not an error.
  if (!input) {
    return {}
  }
  if (!isValidDecimal(input)) {
    return { error: t('gas.override.error.invalidNumber') }
  }
  if (currentBaseFee && parseFloat(input) < parseFloat(currentBaseFee)) {
    return { error: t('gas.override.error.maxBaseBelowCurrent', { value: currentBaseFee }) }
  }
  return {}
}

function validatePriorityFee(args: { input?: string; recommended?: string; t: TranslateFn }): {
  error?: string
  warning?: string
} {
  const { input, recommended, t } = args
  // Empty input means "no override for this field" — not an error.
  if (!input) {
    return {}
  }
  if (!isValidDecimal(input)) {
    return { error: t('gas.override.error.invalidNumber') }
  }
  if (recommended && parseFloat(input) < parseFloat(recommended) * 0.5) {
    return { warning: t('gas.override.warning.priorityFeeLow') }
  }
  return {}
}

function validateGasLimit(args: { input?: string; recommended?: string; t: TranslateFn }): {
  error?: string
  warning?: string
} {
  const { input, recommended, t } = args
  // Empty input means "no override for this field" — not an error.
  if (!input) {
    return {}
  }
  // Strip commas first so a bare separator (e.g. ",") fails validation
  // rather than matching a digits-or-commas pattern with no digits.
  const cleaned = input.replace(/,/g, '')
  if (!/^[0-9]+$/.test(cleaned)) {
    return { error: t('gas.override.error.invalidNumber') }
  }
  const parsed = parseInt(cleaned, 10)
  // Zero would be forwarded to the gas service / RPC as `gasLimit: 0` and the
  // tx would silently fail at broadcast — see SWAP-2688. Reject up front so
  // Save is disabled with an inline error.
  if (parsed === 0) {
    return { error: t('gas.override.error.gasLimitTooLow') }
  }
  // Inform the user (but do NOT block Save) when their gas limit is below the
  // route-aware baseline the gas service returned. Lower-than-recommended is
  // a legitimate power-user override, so a warning is the right intensity.
  if (recommended) {
    const recommendedParsed = parseInt(recommended.replace(/,/g, ''), 10)
    if (Number.isFinite(recommendedParsed) && parsed < recommendedParsed) {
      return { warning: t('gas.override.warning.gasLimitLow', { value: recommended }) }
    }
  }
  return {}
}

function isValidDecimal(s: string): boolean {
  const cleaned = s.replace(/,/g, '')
  // oxlint-disable-next-line security/detect-unsafe-regex -- anchored, no quantifier overlap, ReDoS-safe
  return /^[0-9]+(\.[0-9]+)?$/.test(cleaned)
}
