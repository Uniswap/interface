import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ColorTokens } from 'ui/src'
import { Text } from 'ui/src'
import { Settings } from 'ui/src/components/icons/Settings'
import { SettingsWarning } from 'ui/src/components/icons/SettingsWarning'
import type { IconSizeTokens } from 'ui/src/theme'
import { SLIPPAGE_CRITICAL_TOLERANCE } from 'uniswap/src/constants/transactions'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useTransactionSettingsStore } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { TransactionSettingsButtonWithTooltip } from 'uniswap/src/features/transactions/components/settings/TransactionSettingsButton'
import { getSlippageWarningColor } from 'uniswap/src/features/transactions/swap/utils/styleHelpers'
import { isExtensionApp, isMobileWeb, isWebApp } from 'utilities/src/platform'

const getSettingsIconBackgroundColor = (autoSlippageTolerance: number, slippageTolerance?: number): ColorTokens => {
  if (!slippageTolerance) {
    return '$transparent'
  }
  if (slippageTolerance >= SLIPPAGE_CRITICAL_TOLERANCE) {
    return '$statusCritical2'
  }
  if (slippageTolerance > autoSlippageTolerance) {
    return '$statusWarning2'
  }
  return '$surface3'
}

interface TransactionSettingsButtonProps {
  iconColor?: ColorTokens
  iconSize?: IconSizeTokens
  customSlippageTolerance?: number
  autoSlippageTolerance: number
  isZeroSlippage?: boolean
}

export function TransactionSettingsButtonWithSlippage({
  iconColor = '$neutral2',
  iconSize,
  autoSlippageTolerance,
  isZeroSlippage,
}: TransactionSettingsButtonProps): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const customSlippageTolerance = useTransactionSettingsStore((s) => s.customSlippageTolerance)

  const shouldShowCustomSlippage = customSlippageTolerance && !isZeroSlippage

  const meetsPlatformConditions = (isWebApp || isExtensionApp) && !isMobileWeb
  const exceedsSlippageTolerance = !!customSlippageTolerance && customSlippageTolerance > autoSlippageTolerance

  const shouldShowSettingsIconTooltip = meetsPlatformConditions && exceedsSlippageTolerance

  const { backgroundColor, contentColor, IconComponent } = useMemo(() => {
    const iconBackgroundColor = getSettingsIconBackgroundColor(autoSlippageTolerance, customSlippageTolerance)
    const fillColor = getSlippageWarningColor({
      customSlippageValue: customSlippageTolerance ?? 0,
      autoSlippageTolerance,
      fallbackColorValue: iconColor,
    })
    const SettingsIconComponent =
      customSlippageTolerance && customSlippageTolerance > SLIPPAGE_CRITICAL_TOLERANCE ? SettingsWarning : Settings

    return { backgroundColor: iconBackgroundColor, contentColor: fillColor, IconComponent: SettingsIconComponent }
  }, [customSlippageTolerance, iconColor, autoSlippageTolerance])

  return (
    <TransactionSettingsButtonWithTooltip
      iconSize={iconSize}
      contentColor={contentColor}
      backgroundColor={backgroundColor}
      CustomIconComponent={IconComponent}
      Tooltip={
        shouldShowSettingsIconTooltip && <Text variant="body4">{t('swap.settings.slippage.warning.hover')}</Text>
      }
      IconLabel={
        shouldShowCustomSlippage && (
          <Text color={contentColor} variant="buttonLabel3">
            {formatPercent(customSlippageTolerance)}
          </Text>
        )
      }
    />
  )
}
