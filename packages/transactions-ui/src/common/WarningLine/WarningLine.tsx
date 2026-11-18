import { Flex, Text, Tooltip, TouchableArea } from '@universe/mycelium'
import type { GeneratedIcon } from '@universe/mycelium/icons'
import { AlertTriangleFilled } from '@universe/mycelium/icons/AlertTriangleFilled'
import { getWarningLevelTextColor, type WarningLevel } from '@universe/transactions-ui/src/common/warningLevel'

export interface WarningLineProps {
  /** Product copy, e.g. "High slippage" or "Insufficient ETH balance". */
  message?: string
  /** Paints the icon and the text. Omit for a warning without a level: the line paints neutral, like `info`. */
  level?: WarningLevel
  /** Replaces the filled alert triangle, e.g. the warning's own icon. `null` renders the message alone. */
  Icon?: GeneratedIcon | null
  /**
   * `compact`: under a setting's label (16px icon, 4px gap).
   * `start`: the left side of the web swap form footer, beside the gas toggle (20px icon).
   * `center`: a line of its own under the native gas row (16px icon at a 1.5 stroke, centered text).
   */
  layout?: 'compact' | 'start' | 'center'
  /** Hover text for the line. The host decides where it applies (desktop web only, for slippage). */
  tooltip?: string
  /** Opens the warning's details. Omit when the host wraps the line in its own trigger (the web tooltip shell). */
  onPress?: () => void
}

const ICON_PROPS = {
  compact: { size: '$icon.16' },
  start: { size: '$icon.20' },
  center: { size: '$icon.16', strokeWidth: 1.5 },
} as const

/**
 * A one-line warning: an icon and the message in the level's color. Rendered in
 * SettingsRow's `warning` slot, under the native deadline stepper, and in the swap form
 * footer (in the rate's place on web, on a line of its own on native).
 *
 * Replaces WarningMessage and the form footer's warning markup.
 *
 * @alias WarningMessage, FormWarningLine, SettingsWarning, InlineWarning
 */
export function WarningLine({
  message,
  level,
  Icon = AlertTriangleFilled,
  layout = 'compact',
  tooltip,
  onPress,
}: WarningLineProps): JSX.Element {
  const color = level ? getWarningLevelTextColor(level) : '$neutral2'
  const icon = Icon ? <Icon color={color} {...ICON_PROPS[layout]} /> : null

  const line =
    layout === 'compact' ? (
      <Flex row alignItems="center" gap="$gap4">
        {icon}
        <Text variant="body3" color={color}>
          {message}
        </Text>
      </Flex>
    ) : (
      <Flex centered row gap="$spacing8">
        {icon}
        <Text color={color} textAlign={layout === 'center' ? 'center' : undefined} variant="body3">
          {message}
        </Text>
      </Flex>
    )

  const content = tooltip ? (
    <Tooltip>
      <Tooltip.Trigger>{line}</Tooltip.Trigger>
      <Tooltip.Content>
        <Text variant="body4">{tooltip}</Text>
      </Tooltip.Content>
    </Tooltip>
  ) : (
    line
  )

  return onPress ? <TouchableArea onPress={onPress}>{content}</TouchableArea> : content
}
