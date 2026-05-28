import { useTranslation } from 'react-i18next'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { isLowSlippage } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/SlippageLPWarning'
import {
  useTransactionSettingsAutoSlippageToleranceStore,
  useTransactionSettingsStore,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { ErrorCallout } from '~/components/ErrorCallout'

export function LowLPSlippageWarning({ isNativePool }: { isNativePool: boolean }) {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const { customSlippageTolerance, isSlippageDirty } = useTransactionSettingsStore((s) => ({
    customSlippageTolerance: s.customSlippageTolerance,
    isSlippageDirty: s.isSlippageDirty,
  }))
  const autoSlippageTolerance = useTransactionSettingsAutoSlippageToleranceStore((s) => s.autoSlippageTolerance)
  const effectiveSlippage = customSlippageTolerance ?? autoSlippageTolerance

  const isLowSlippageWarning = isLowSlippage({
    isNativePool,
    isSlippageDirty,
    effectiveSlippage,
  })

  return (
    <ErrorCallout
      errorMessage={isLowSlippageWarning}
      title={t('pool.liquidity.slippage.warning.low.required')}
      description={t('pool.liquidity.slippage.warning.low.required.description', {
        slippage: formatPercent(effectiveSlippage, 4),
      })}
      isWarning
    />
  )
}
