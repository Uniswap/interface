import { WarningLine } from '@universe/transactions-ui'
import { useTranslation } from 'react-i18next'
import { SlippageWarning } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/SlippageWarning'
import {
  useTransactionSettingsAutoSlippageToleranceStore,
  useTransactionSettingsStore,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'

export const SLIPPAGE_LOW_TOLERANCE_LP = 0.05

interface SlippageLPWarningProps {
  isNativePool: boolean
}

export function isLowSlippage({
  isNativePool,
  isSlippageDirty,
  effectiveSlippage,
}: {
  isNativePool: boolean
  isSlippageDirty: boolean
  effectiveSlippage?: number
}): boolean {
  if (effectiveSlippage === undefined) {
    return false
  }

  return Boolean(
    isNativePool && !isSlippageDirty && effectiveSlippage >= 0 && effectiveSlippage < SLIPPAGE_LOW_TOLERANCE_LP,
  )
}

export function SlippageLPWarning({ isNativePool }: SlippageLPWarningProps): JSX.Element | null {
  const { t } = useTranslation()
  const { customSlippageTolerance, isSlippageDirty } = useTransactionSettingsStore((s) => ({
    customSlippageTolerance: s.customSlippageTolerance,
    isSlippageDirty: s.isSlippageDirty,
  }))
  const autoSlippageTolerance = useTransactionSettingsAutoSlippageToleranceStore((s) => s.autoSlippageTolerance)
  const effectiveSlippage = customSlippageTolerance ?? autoSlippageTolerance

  const isLowSlippageWarning = isLowSlippage({
    isNativePool,
    isSlippageDirty,
    effectiveSlippage: effectiveSlippage ?? 0,
  })

  if (isLowSlippageWarning) {
    return (
      <WarningLine
        message={t('swap.settings.slippage.alert.low')}
        tooltip={t('swap.settings.slippage.warning.low.lp')}
        level="warning"
      />
    )
  }

  return <SlippageWarning />
}
