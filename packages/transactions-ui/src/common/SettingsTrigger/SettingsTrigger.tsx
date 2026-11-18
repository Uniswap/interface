import { type ColorTokens, Flex, Text, Tooltip, TouchableArea } from '@universe/mycelium'
import { Settings } from '@universe/mycelium/icons/Settings'
import { SettingsWarning } from '@universe/mycelium/icons/SettingsWarning'
import { SETTINGS_TRIGGER_STYLES } from '@universe/transactions-ui/src/common/SettingsTrigger/settingsTriggerStyles'
import type { SlippageWarningLevel } from '@universe/transactions-ui/src/common/types'

export interface SettingsTriggerProps {
  /** Opens or closes the settings. The host also dismisses the native keyboard. */
  onPress: () => void
  /** A custom slippage tolerance is set: the gear sits on a tinted pill. */
  isCustom?: boolean
  /**
   * Formatted custom tolerance shown before the gear, e.g. `0.75%`. Omit while auto, and
   * when the transaction carries no slippage even though a custom value is set (a bridge).
   */
  customValue?: string
  /** Tints the pill and paints the value and gear. `critical` also swaps in the warning gear. */
  warningLevel?: SlippageWarningLevel
  /**
   * Hover text explaining the warning. The host decides when it applies: web and extension
   * only, never while the settings are open.
   */
  tooltip?: string
  /** Pins the height to 32px so the gear lines up with the header tabs. The web app adapter sets it. */
  fixedHeight?: boolean
  testID?: string
}

function getBackgroundColor(isCustom: boolean, warningLevel: SlippageWarningLevel | undefined): ColorTokens {
  if (!isCustom) {
    return '$transparent'
  }
  if (warningLevel === 'critical') {
    return '$statusCritical2'
  }
  if (warningLevel === 'warning') {
    return '$statusWarning2'
  }
  return '$surface3'
}

function getContentColor(warningLevel: SlippageWarningLevel | undefined): ColorTokens {
  if (warningLevel === 'critical') {
    return '$statusCritical'
  }
  if (warningLevel === 'warning') {
    return '$statusWarning'
  }
  return '$neutral2'
}

/**
 * The settings gear in the swap header and the Liquidity modal header, with the custom
 * slippage value in front of it and the slippage warning tint. Content of the trigger
 * only: the popover around it, the view-only wallet button and the modals stay in the
 * adapter.
 *
 * Replaces TransactionSettingsButton, TransactionSettingsButtonWithTooltip and the
 * slippage styling of TransactionSettingsButtonWithSlippage, plus the TouchableArea that
 * TransactionSettings wraps around them. Adapters map `warningLevel` from the comparisons
 * getSettingsIconBackgroundColor and getSlippageWarningColor make today (`warnLowSlippage`
 * for LP is `warning`). The warning gear follows `critical` (20% and up), like the tint; the
 * old gear swapped icons only above 20%.
 */
export function SettingsTrigger({
  onPress,
  isCustom = false,
  customValue,
  warningLevel,
  tooltip,
  fixedHeight = false,
  testID,
}: SettingsTriggerProps): JSX.Element {
  const contentColor = getContentColor(warningLevel)
  const Icon = warningLevel === 'critical' ? SettingsWarning : Settings

  const button = (
    <Flex
      centered
      row
      backgroundColor={getBackgroundColor(isCustom, warningLevel)}
      borderRadius="$roundedFull"
      gap="$spacing4"
      px={customValue ? '$spacing8' : '$spacing4'}
      py="$spacing4"
      height={fixedHeight ? '$spacing32' : 'auto'}
    >
      {customValue ? (
        <Text color={contentColor} variant="buttonLabel3">
          {customValue}
        </Text>
      ) : null}
      <Flex rotate="0deg" hoverStyle={{ rotate: '90deg' }} {...SETTINGS_TRIGGER_STYLES.gearFrame}>
        <Icon color={contentColor} hoverColor="$neutral2Hovered" size={SETTINGS_TRIGGER_STYLES.iconSize} />
      </Flex>
    </Flex>
  )

  return (
    <TouchableArea testID={testID} onPress={onPress}>
      {tooltip ? (
        <Tooltip>
          <Tooltip.Trigger>{button}</Tooltip.Trigger>
          <Tooltip.Content>
            <Text variant="body4">{tooltip}</Text>
          </Tooltip.Content>
        </Tooltip>
      ) : (
        button
      )}
    </TouchableArea>
  )
}
