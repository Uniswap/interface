import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ColorTokens, Flex, isWeb, Popover, Text, Tooltip, TouchableArea } from 'ui/src'
import { Settings } from 'ui/src/components/icons/Settings'
import { SettingsWarning } from 'ui/src/components/icons/SettingsWarning'
import { IconSizeTokens } from 'ui/src/theme'
import { SLIPPAGE_CRITICAL_TOLERANCE } from 'uniswap/src/constants/transactions'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useSlippageSettings } from 'uniswap/src/features/transactions/swap/settings/useSlippageSettings'
import { getSlippageWarningColor } from 'uniswap/src/features/transactions/swap/utils/styleHelpers'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isInterface } from 'utilities/src/platform'

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

interface SwapFormSettingsButtonProps {
  showCustomSlippage: boolean
  showTooltip: boolean
  customSlippageTolerance?: number
  onPress: () => void
  iconColor?: ColorTokens
  iconSize?: IconSizeTokens
}

export function SwapFormSettingsButton({
  showCustomSlippage,
  showTooltip,
  customSlippageTolerance,
  onPress,
  iconColor,
  iconSize,
}: SwapFormSettingsButtonProps): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const { autoSlippageTolerance } = useSlippageSettings()

  // Icon settings (background color, content color, and component) based on slippage tolerance
  const { backgroundColor, contentColor, IconComponent } = useMemo(() => {
    const iconBackgroundColor = getSettingsIconBackgroundColor(autoSlippageTolerance, customSlippageTolerance)
    const fillColor = getSlippageWarningColor(customSlippageTolerance ?? 0, autoSlippageTolerance, iconColor)
    const SettingsIconComponent =
      customSlippageTolerance && customSlippageTolerance > SLIPPAGE_CRITICAL_TOLERANCE ? SettingsWarning : Settings

    return { backgroundColor: iconBackgroundColor, contentColor: fillColor, IconComponent: SettingsIconComponent }
  }, [customSlippageTolerance, iconColor, autoSlippageTolerance])

  const content = (
    <Popover.Trigger>
      <TouchableArea testID={TestID.SwapSettings} onPress={onPress}>
        <Flex
          centered
          row
          backgroundColor={backgroundColor}
          borderRadius="$roundedFull"
          gap="$spacing4"
          px={showCustomSlippage ? '$spacing8' : '$spacing4'}
          py="$spacing4"
          height={isInterface ? '$spacing32' : 'auto'}
        >
          {showCustomSlippage && (
            <Text color={contentColor} variant="buttonLabel3">
              {formatPercent(customSlippageTolerance)}
            </Text>
          )}
          <IconComponent color={contentColor} size={iconSize ?? (isWeb ? 20 : 24)} />
        </Flex>
      </TouchableArea>
    </Popover.Trigger>
  )

  if (showTooltip) {
    return (
      <Tooltip>
        <Tooltip.Trigger>{content}</Tooltip.Trigger>
        <Tooltip.Content>
          <Text variant="body4">{t('swap.settings.slippage.warning.hover')}</Text>
        </Tooltip.Content>
      </Tooltip>
    )
  }

  return content
}
