import { useMemo } from 'react'
import { Flex, TouchableArea, TouchableAreaProps, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { Arrow } from 'wallet/src/components/icons/Arrow'

type SwapArrowButtonProps = Pick<
  TouchableAreaProps,
  'disabled' | 'testID' | 'onPress' | 'borderColor' | 'backgroundColor'
> & { size?: number }

export function SwapArrowButton(props: SwapArrowButtonProps): JSX.Element {
  const colors = useSporeColors()
  const {
    testID,
    onPress,
    disabled,
    backgroundColor = '$surface2',
    size = iconSizes.icon24,
    ...rest
  } = props
  return useMemo(
    () => (
      <TouchableArea
        hapticFeedback
        alignItems="center"
        alignSelf="center"
        backgroundColor={backgroundColor}
        borderColor="$surface3"
        borderRadius="$rounded16"
        borderWidth={1}
        disabled={disabled}
        justifyContent="center"
        p="$spacing8"
        testID={testID}
        onPress={onPress}
        {...rest}>
        {/* hack to add 2px more padding without adjusting design system values */}
        <Flex centered p="$spacing2">
          <Arrow color={colors.neutral2.val} direction="s" size={size} />
        </Flex>
      </TouchableArea>
    ),
    [backgroundColor, disabled, onPress, testID, rest, colors.neutral2.val, size]
  )
}
