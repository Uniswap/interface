import { XStackProps } from 'tamagui'
import { commonPressStyle } from 'ui/src/components/buttons/Button/components/CustomButtonFrame/constants'

// We have this because, if `COMMON_PRESS_STYLE` is applied in the top=level of `styled`'s options, it gets overridden by any additional `pressStyle` passed in via a subsequent variant
export const withCommonPressStyle = (style: XStackProps['pressStyle']): XStackProps['pressStyle'] => ({
  ...commonPressStyle,
  ...style,
})
