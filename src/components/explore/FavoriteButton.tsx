import React from 'react'
import { FadeInRight } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import PlusIcon from 'src/assets/icons/plus.svg'
import { AnimatedTouchableArea, BaseButtonProps } from 'src/components/buttons/TouchableArea'
import { Box } from 'src/components/layout/Box'

export function FavoriteButton({
  disabled,
  ...rest
}: { disabled: boolean } & BaseButtonProps): JSX.Element {
  const theme = useAppTheme()
  return (
    <Box opacity={disabled ? 0 : 1}>
      <AnimatedTouchableArea
        hapticFeedback
        borderRadius="full"
        borderWidth={1}
        disabled={disabled}
        entering={FadeInRight}
        justifyContent="center"
        padding="xs"
        {...rest}
        style={{
          backgroundColor: theme.colors.translucentBackgroundBackdrop,
          borderColor: theme.colors.backgroundOutline,
        }}>
        <PlusIcon color={theme.colors.textSecondary} height={14} strokeWidth={2} width={14} />
      </AnimatedTouchableArea>
    </Box>
  )
}
