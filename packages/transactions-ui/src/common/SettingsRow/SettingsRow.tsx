import { Flex, Switch, Text, TouchableArea } from '@universe/mycelium'
import { InfoCircleFilled } from '@universe/mycelium/icons/InfoCircleFilled'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { SETTINGS_ROW_STYLES } from '@universe/transactions-ui/src/common/SettingsRow/settingsRowStyles'
import type { ReactNode } from 'react'
import { noop } from 'utilities/src/react/noop'

/** A switch on the right of the row. */
export interface SettingsRowToggle {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  /** Shown but not toggleable, e.g. swap protection on a chain without a private RPC. */
  disabled?: boolean
}

export interface SettingsRowProps {
  /** Product copy, e.g. "Max slippage", "Swap deadline", "Trade options". */
  label: string
  /**
   * Slot: one line of small print under the label, e.g. the network swap protection covers.
   * It renders in neutral2 body3, so a string works as is. A slot because a settings config
   * renders its description as a component.
   */
  description?: ReactNode
  /**
   * Slot: the info icon wrapped in its tooltip (web), next to the label. The adapter
   * composes the tooltip, its text and any "Learn more" link.
   */
  infoTooltip?: ReactNode
  /** Makes the label side pressable and adds an info icon after the label. The host opens its info modal. */
  onPressInfo?: () => void
  /**
   * Slot: the warning line under the label, a WarningLine or nothing. A slot because
   * a settings config decides its warning in a component of its own.
   */
  warning?: ReactNode
  /**
   * Right side. A string renders as the standard value text (`Default`, `30 minutes`).
   * Pass a node for an inline control (SlippageInlineInput, SlippageSettingValue, the
   * deadline input). Usually set alone or with `onPress`, not with `toggle`.
   */
  value?: ReactNode
  toggle?: SettingsRowToggle
  /** The row opens a page of its own: the right side presses through and a chevron follows the value. */
  onPress?: () => void
  testID?: string
}

/**
 * One transaction setting: label (with optional info, description and warning) on the
 * left, its value, switch or chevron on the right. Rendered by the swap settings on every
 * platform and by web Liquidity's settings (Max slippage, Deadline).
 *
 * Replaces the markup of TransactionSettingRow. What the old row read from
 * TransactionSettingConfig arrives as props: renderTitle is `label`, Description is the
 * `description` slot, renderTooltip is the `infoTooltip` slot, InfoModal is `onPressInfo`
 * (the modal stays in the adapter), Warning is the `warning` slot, Control is `value` or
 * `toggle`, and Screen is `onPress`. The feature flag gate stays in the adapter.
 */
export function SettingsRow({
  label,
  description,
  infoTooltip,
  onPressInfo,
  warning,
  value,
  toggle,
  onPress,
  testID,
}: SettingsRowProps): JSX.Element {
  const labelColumn = (
    <Flex gap="$spacing2" justifyContent="center" minHeight={48}>
      <Flex row alignItems="center" gap="$spacing4" minWidth={0}>
        <Text color="$neutral1" flexShrink={1} variant="subheading2" whiteSpace="initial">
          {label}
        </Text>
        {onPressInfo && <InfoCircleFilled color="$neutral3" size="$icon.16" />}
        {infoTooltip}
      </Flex>
      {description && (
        <Text color="$neutral2" variant="body3">
          {description}
        </Text>
      )}
      {warning}
    </Flex>
  )

  return (
    <Flex testID={testID}>
      <Flex centered row columnGap="$spacing16" justifyContent="space-between">
        <Flex flexGrow={1} flexShrink={1} minWidth={0}>
          {onPressInfo ? <TouchableArea onPress={onPressInfo}>{labelColumn}</TouchableArea> : labelColumn}
        </Flex>
        <TouchableArea
          group
          flexDirection="row"
          alignItems="center"
          gap="$spacing4"
          justifyContent="flex-end"
          flexShrink={1}
          // Always handled, like the old row: a press on the control stops here (web) and keeps
          // its press feedback (native), with or without a page to open.
          onPress={onPress ?? noop}
        >
          {typeof value === 'string' ? (
            <Text color="$neutral2" flexWrap="wrap" variant="subheading2" $group-hover={{ color: '$neutral2Hovered' }}>
              {value}
            </Text>
          ) : (
            value
          )}
          {toggle && (
            <Switch
              checked={toggle.checked}
              disabled={toggle.disabled}
              variant="branded"
              onCheckedChange={toggle.onCheckedChange}
            />
          )}
          {onPress && <RotatableChevron color="$neutral3" direction="right" size="$icon.24" />}
        </TouchableArea>
      </Flex>
    </Flex>
  )
}

export interface SettingsRowListProps {
  /** Slot: the SettingsRows of one page. */
  children: ReactNode
}

/** The stack of rows on the settings sheet's top-level page. Replaces TopLevelSettings in TransactionSettingsModalContent. */
export function SettingsRowList({ children }: SettingsRowListProps): JSX.Element {
  return (
    <Flex gap={SETTINGS_ROW_STYLES.listGap} py={SETTINGS_ROW_STYLES.listPy}>
      {children}
    </Flex>
  )
}
