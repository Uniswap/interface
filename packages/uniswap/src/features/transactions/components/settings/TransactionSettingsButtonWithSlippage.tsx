import { isExtensionApp, isMobileWeb, isWebApp } from '@universe/environment'
import { SettingsTrigger } from '@universe/transactions-ui'
import { useTranslation } from 'react-i18next'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { SLIPPAGE_LOW_TOLERANCE_LP } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/SlippageLPWarning'
import { TransactionSettingsModalId } from 'uniswap/src/features/transactions/components/settings/stores/TransactionSettingsModalStore/createTransactionSettingsModalStore'
import { useModalVisibility } from 'uniswap/src/features/transactions/components/settings/stores/TransactionSettingsModalStore/useTransactionSettingsModalStore'
import { useTransactionSettingsStore } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import type { TransactionSettingsTriggerProps } from 'uniswap/src/features/transactions/components/settings/TransactionSettings'
import { getSlippageWarningLevel } from 'uniswap/src/features/transactions/swap/utils/styleHelpers'

interface TransactionSettingsButtonProps extends TransactionSettingsTriggerProps {
  autoSlippageTolerance: number
  isZeroSlippage?: boolean
  warnLowSlippage?: boolean
}

export function TransactionSettingsButtonWithSlippage({
  onPress,
  testID,
  autoSlippageTolerance,
  isZeroSlippage,
  warnLowSlippage,
}: TransactionSettingsButtonProps): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const customSlippageTolerance = useTransactionSettingsStore((s) => s.customSlippageTolerance)
  const isTransactionSettingsModalVisible = useModalVisibility(TransactionSettingsModalId.TransactionSettings)

  const shouldShowCustomSlippage = customSlippageTolerance && !isZeroSlippage

  const meetsPlatformConditions = (isWebApp || isExtensionApp) && !isMobileWeb
  const exceedsSlippageTolerance = !!customSlippageTolerance && customSlippageTolerance > autoSlippageTolerance
  const belowLowTolerance =
    warnLowSlippage && !!customSlippageTolerance && customSlippageTolerance < SLIPPAGE_LOW_TOLERANCE_LP

  const shouldShowSettingsIconTooltip = meetsPlatformConditions && (exceedsSlippageTolerance || belowLowTolerance)

  // getSettingsIconBackgroundColor and getSlippageWarningColor made the same comparisons for the
  // tint and the content color. From 20% the gear is also the warning gear; it used to swap only
  // above 20%.
  const warningLevel = getSlippageWarningLevel({
    customSlippageValue: customSlippageTolerance ?? 0,
    autoSlippageTolerance,
    warnLowSlippage,
  })

  const tooltip =
    shouldShowSettingsIconTooltip && !isTransactionSettingsModalVisible
      ? belowLowTolerance
        ? t('swap.settings.slippage.warning.low.lp')
        : t('swap.settings.slippage.warning.hover')
      : undefined

  return (
    <SettingsTrigger
      isCustom={Boolean(customSlippageTolerance)}
      customValue={shouldShowCustomSlippage ? formatPercent(customSlippageTolerance, 4) : undefined}
      warningLevel={warningLevel}
      tooltip={tooltip}
      fixedHeight={isWebApp}
      testID={testID}
      onPress={onPress}
    />
  )
}
