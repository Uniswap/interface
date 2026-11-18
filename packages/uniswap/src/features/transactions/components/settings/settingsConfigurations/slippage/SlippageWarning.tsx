import { isMobileWeb, isWebPlatform } from '@universe/environment'
import { WarningLine } from '@universe/transactions-ui'
import { useTranslation } from 'react-i18next'
import { SLIPPAGE_CRITICAL_TOLERANCE } from 'uniswap/src/constants/transactions'
import { useSlippageSettings } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/useSlippageSettings'
import {
  useTransactionSettingsAutoSlippageToleranceStore,
  useTransactionSettingsStore,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'

export function SlippageWarning(): JSX.Element | null {
  const { t } = useTranslation()
  const customSlippageTolerance = useTransactionSettingsStore((s) => s.customSlippageTolerance)
  const storeAutoSlippageTolerance = useTransactionSettingsAutoSlippageToleranceStore((s) => s.autoSlippageTolerance)
  const { autoSlippageTolerance } = useSlippageSettings()
  const actualAutoSlippageTolerance = storeAutoSlippageTolerance ?? autoSlippageTolerance

  const isCriticalSlippage = Boolean(customSlippageTolerance && customSlippageTolerance >= SLIPPAGE_CRITICAL_TOLERANCE)

  if (!customSlippageTolerance || customSlippageTolerance <= actualAutoSlippageTolerance) {
    return null
  }

  return (
    <WarningLine
      message={isCriticalSlippage ? t('swap.settings.slippage.warning') : t('swap.settings.slippage.alert')}
      tooltip={isWebPlatform && !isMobileWeb ? t('swap.settings.slippage.warning.hover') : undefined}
      level={isCriticalSlippage ? 'critical' : 'warning'}
    />
  )
}
