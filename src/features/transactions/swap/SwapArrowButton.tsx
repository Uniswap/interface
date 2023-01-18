import React, { ComponentProps, ReactElement, useMemo } from 'react'
import { useAppTheme } from 'src/app/hooks'
import SwapArrow from 'src/assets/icons/swap-arrow.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box } from 'src/components/layout'

type SwapArrowButtonProps = Pick<
  ComponentProps<typeof TouchableArea>,
  'disabled' | 'name' | 'onPress' | 'borderColor' | 'bg'
> & { size?: number }

export function SwapArrowButton(props: SwapArrowButtonProps): ReactElement {
  const theme = useAppTheme()
  const { name, onPress, disabled, bg = 'background1', size = theme.iconSizes.md, ...rest } = props
  return useMemo(
    () => (
      <TouchableArea
        hapticFeedback
        alignItems="center"
        alignSelf="center"
        bg={bg}
        borderColor="background1"
        borderRadius="lg"
        borderWidth={4}
        disabled={disabled}
        justifyContent="center"
        // border width applies inside the element so add more padding to account for it
        name={name}
        p="xs"
        onPress={onPress}
        {...rest}>
        {/* hack to add 2px more padding without adjusting design system values */}
        <Box alignItems="center" justifyContent="center" p="xxxs">
          <SwapArrow color={theme.colors.textSecondary} height={size} width={size} />
        </Box>
      </TouchableArea>
    ),
    [bg, disabled, name, onPress, rest, theme.colors.textSecondary, size]
  )
}
