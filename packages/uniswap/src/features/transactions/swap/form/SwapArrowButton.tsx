import { useMemo } from 'react'
import { Flex, TouchableArea, TouchableAreaProps, useIsShortMobileDevice, useSporeColors } from 'ui/src'
import { Arrow } from 'ui/src/components/arrow/Arrow'
import { iconSizes } from 'ui/src/theme'

type SwapArrowButtonProps = Pick<
  TouchableAreaProps,
  'disabled' | 'testID' | 'onPress' | 'borderColor' | 'backgroundColor'
> & { size?: number }

export function SwapArrowButton(props: SwapArrowButtonProps): JSX.Element {
  const colors = useSporeColors()
  const { testID, onPress, disabled, backgroundColor = '$surface2', size = iconSizes.icon24, ...rest } = props
  const isShortMobileDevice = useIsShortMobileDevice()

  return useMemo(
    () => (
      <TouchableArea
        hapticFeedback
        alignItems="center"
        alignSelf="center"
        backgroundColor={backgroundColor}
        borderColor="$surface1"
        borderRadius={isShortMobileDevice ? '$rounded12' : '$rounded16'}
        borderWidth={isShortMobileDevice ? 2 : 4}
        disabled={disabled}
        justifyContent="center"
        p={isShortMobileDevice ? '$spacing4' : '$spacing8'}
        testID={testID}
        onPress={onPress}
        {...rest}
      >
        {/* hack to add 2px more padding without adjusting design system values */}
        <Flex centered p="$spacing2">
          <Arrow color={colors.neutral1.val} direction="s" size={size} />
        </Flex>
      </TouchableArea>
    ),
    [backgroundColor, isShortMobileDevice, disabled, testID, onPress, rest, colors.neutral1.val, size],
  )
}
