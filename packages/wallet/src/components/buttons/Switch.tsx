import { Switch as TamaguiSwitch, SwitchProps as TamaguiSwitchProps, useSporeColors } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { isAndroid } from 'uniswap/src/utils/platform'

type SwitchProps = {
  value?: boolean
  onValueChange: (newValue: boolean) => void
} & Omit<TamaguiSwitchProps, 'value'>

// A themed switch toggle
export function Switch({ value, onValueChange, disabled }: SwitchProps): JSX.Element {
  const colors = useSporeColors()

  const enabledThumbColor = colors.accent1.val
  const disabledThumbColor = isAndroid ? colors.neutral3.val : colors.surface1.val

  const enabledTrackColor = colors.accentSoft.val
  const disabledTrackColor = isAndroid ? colors.surface3.val : colors.accentSoft.val

  return (
    <TamaguiSwitch
      animation="quick"
      checked={value}
      disabled={disabled}
      native="mobile"
      nativeProps={{
        thumbColor: value ? enabledThumbColor : disabledThumbColor,
        trackColor: {
          true: enabledTrackColor,
          false: disabledTrackColor,
        },
      }}
      onCheckedChange={disabled ? undefined : onValueChange}>
      <TamaguiSwitch.Thumb />
    </TamaguiSwitch>
  )
}

// TODO(EXT-874): consolidate into Switch component above, which wasn't working on web.
// separating them is to avoid breaking anything on the iOS or Android switches
const THUMB_HEIGHT = spacing.spacing24
const THUMB_PADDING = spacing.spacing4
const TRACK_HEIGHT = THUMB_HEIGHT + THUMB_PADDING * 2

export function WebSwitch({ value, onValueChange }: SwitchProps): JSX.Element {
  const checked = value
  return (
    <TamaguiSwitch
      alignItems="center"
      backgroundColor={checked ? '$accent2' : '$surface2'}
      borderWidth={0}
      checked={checked}
      defaultChecked={checked}
      hoverStyle={hoverStyle}
      justifyContent="center"
      minHeight={TRACK_HEIGHT}
      minWidth={spacing.spacing60}
      p="$spacing4"
      onCheckedChange={onValueChange}>
      <TamaguiSwitch.Thumb
        animation="semiBouncy"
        backgroundColor={checked ? '$accent1' : '$neutral3'}
        minHeight={THUMB_HEIGHT}
        width="$spacing24"
      />
    </TamaguiSwitch>
  )
}

const hoverStyle = {
  cursor: 'pointer',
}
