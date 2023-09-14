import React, { ComponentProps, useMemo } from 'react'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Arrow } from 'src/components/icons/Arrow'
import { Flex, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'

type SwapArrowButtonProps = Pick<
  ComponentProps<typeof TouchableArea>,
  'disabled' | 'testID' | 'onPress' | 'borderColor' | 'bg'
> & { size?: number }

export function SwapArrowButton(props: SwapArrowButtonProps): JSX.Element {
  const colors = useSporeColors()
  const { testID, onPress, disabled, bg = 'surface2', size = iconSizes.icon20, ...rest } = props
  return useMemo(
    () => (
      <TouchableArea
        hapticFeedback
        alignItems="center"
        alignSelf="center"
        bg={bg}
        borderColor="surface1"
        borderRadius="rounded16"
        borderWidth={4}
        disabled={disabled}
        justifyContent="center"
        p="spacing8"
        testID={testID}
        onPress={onPress}
        {...rest}>
        {/* hack to add 2px more padding without adjusting design system values */}
        <Flex centered gap="$none" p="$spacing2">
          <Arrow color={colors.neutral2.val} direction="s" size={size} />
        </Flex>
      </TouchableArea>
    ),
    [bg, disabled, onPress, testID, rest, colors.neutral2.val, size]
  )
}
