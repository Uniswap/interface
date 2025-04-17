import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ColorTokens, Flex, isWeb, Popover, Text, Tooltip, TouchableArea } from 'ui/src'
import { Settings } from 'ui/src/components/icons/Settings'
import { SettingsWarning } from 'ui/src/components/icons/SettingsWarning'
import { IconSizeTokens } from 'ui/src/theme'
import { SLIPPAGE_CRITICAL_TOLERANCE } from 'uniswap/src/constants/transactions'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useSlippageSettings } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/hooks/useSlippageSettings'
import { getSlippageWarningColor } from 'uniswap/src/features/transactions/swap/utils/styleHelpers'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isInterface } from 'utilities/src/platform'

type SwapFormSettingsButtonProps = {
  shouldShowCustomSlippage: boolean
  shouldShowTooltip: boolean
  customSlippageTolerance?: number
  onPress: () => void
  iconColor?: ColorTokens
  iconSize?: IconSizeTokens
}

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

const Content = ({
  customSlippageTolerance,
  iconColor,
  onPress,
  shouldShowCustomSlippage,
  iconSize: iconSizeProp,
}: Omit<SwapFormSettingsButtonProps, 'shouldShowTooltip'>): JSX.Element => {
  const { autoSlippageTolerance } = useSlippageSettings()
  const { formatPercent } = useLocalizationContext()

  const { backgroundColor, contentColor, IconComponent } = useMemo(() => {
    const iconBackgroundColor = getSettingsIconBackgroundColor(autoSlippageTolerance, customSlippageTolerance)

    const fillColor = getSlippageWarningColor(customSlippageTolerance ?? 0, autoSlippageTolerance, iconColor)

    const SettingsIconComponent =
      customSlippageTolerance && customSlippageTolerance > SLIPPAGE_CRITICAL_TOLERANCE ? SettingsWarning : Settings

    return { backgroundColor: iconBackgroundColor, contentColor: fillColor, IconComponent: SettingsIconComponent }
  }, [customSlippageTolerance, iconColor, autoSlippageTolerance])

  const iconSize = iconSizeProp ?? (isWeb ? 20 : 24)

  return (
    <Popover.Trigger>
      <TouchableArea testID={TestID.SwapSettings} onPress={onPress}>
        <Flex
          centered
          row
          backgroundColor={backgroundColor}
          borderRadius="$roundedFull"
          gap="$spacing4"
          px={shouldShowCustomSlippage ? '$spacing8' : '$spacing4'}
          py="$spacing4"
          height={isInterface ? '$spacing32' : 'auto'}
        >
          {shouldShowCustomSlippage && (
            <Text color={contentColor} variant="buttonLabel3">
              {formatPercent(customSlippageTolerance)}
            </Text>
          )}
          <IconComponent color={contentColor} size={iconSize} />
        </Flex>
      </TouchableArea>
    </Popover.Trigger>
  )
}

export function SwapFormSettingsButton({ shouldShowTooltip, ...rest }: SwapFormSettingsButtonProps): JSX.Element {
  const { t } = useTranslation()

  if (shouldShowTooltip) {
    return (
      <Tooltip>
        <Tooltip.Trigger>
          <Content {...rest} />
        </Tooltip.Trigger>
        <Tooltip.Content>
          <Text variant="body4">{t('swap.settings.slippage.warning.hover')}</Text>
        </Tooltip.Content>
      </Tooltip>
    )
  }

  return <Content {...rest} />
}
