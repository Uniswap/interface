import { useSporeColors } from 'ui/src'
import { Pill, PillProps } from 'uniswap/src/components/pill/Pill'

interface PredefinedAmountProps {
  label: string
}

export function PredefinedAmount({ label, disabled, onPress }: PredefinedAmountProps & PillProps) {
  const colors = useSporeColors()

  return (
    <Pill
      backgroundColor={disabled ? '$surface2' : '$surface1'}
      userSelect="none"
      cursor={disabled ? 'default' : 'pointer'}
      disabled={disabled}
      onPress={onPress}
      hoverStyle={
        disabled
          ? {}
          : {
              backgroundColor: '$surface1Hovered',
              borderColor: '$surface3Hovered',
            }
      }
      customBorderColor={colors.surface3.val}
      foregroundColor={disabled ? colors.neutral3.val : colors.neutral2.val}
      label={label}
      px="$spacing16"
      textVariant="buttonLabel2"
    />
  )
}
