import { FlexProps, TouchableArea, TouchableAreaProps, useIsShortMobileDevice, useSporeColors } from 'ui/src'
import { Arrow } from 'ui/src/components/arrow/Arrow'
import { PRESS_SCALE } from 'ui/src/components/buttons/Button/components/CustomButtonFrame/constants'
import { iconSizes } from 'ui/src/theme'

type SwapArrowButtonProps = Pick<
  TouchableAreaProps,
  'disabled' | 'testID' | 'onPress' | 'backgroundColor' | 'opacity'
> & {
  iconSize?: number
}

const hoverStyle: FlexProps['hoverStyle'] = { backgroundColor: '$surface2Hovered' }

export function SwapArrowButton({
  backgroundColor = '$surface2',
  opacity = undefined,
  iconSize = iconSizes.icon24,
  disabled,
  onPress,
  testID,
}: SwapArrowButtonProps): JSX.Element {
  const colors = useSporeColors()
  const isShortMobileDevice = useIsShortMobileDevice()

  return (
    <TouchableArea
      backgroundColor={backgroundColor}
      borderColor="$surface1"
      borderRadius={isShortMobileDevice ? '$rounded12' : '$rounded16'}
      borderWidth={isShortMobileDevice ? '$spacing2' : '$spacing4'}
      p={isShortMobileDevice ? '$spacing6' : '$spacing8'}
      scaleTo={PRESS_SCALE}
      hoverStyle={hoverStyle}
      disabled={disabled}
      testID={testID}
      opacity={opacity}
      onPress={onPress}
    >
      <Arrow color={colors.neutral1.val} direction="s" size={iconSize} />
    </TouchableArea>
  )
}
