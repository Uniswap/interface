import { SpacingProps, SpacingShorthandProps } from '@shopify/restyle'
import React, { PropsWithChildren } from 'react'
import { Switch as BaseSwitch, ViewProps } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { Box } from 'src/components/layout/Box'
import { Theme } from 'src/styles/theme'

type RestyleProps = SpacingProps<Theme> & SpacingShorthandProps<Theme>

export type SwitchProps = {
  value: boolean
  onValueChange: (newValue: boolean) => void
  disabled?: boolean
} & RestyleProps &
  ViewProps

// A themed switch toggle
// TODO may need to replace with a custom switch implementation to match designs
export function Switch({
  value,
  onValueChange,
  disabled,
  ...rest
}: PropsWithChildren<SwitchProps>) {
  const theme = useAppTheme()

  return (
    <Box {...rest}>
      <BaseSwitch
        ios_backgroundColor={theme.colors.backgroundAction}
        thumbColor={value ? theme.colors.accentActive : theme.colors.textTertiary}
        trackColor={{
          false: theme.colors.backgroundAction,
          true: theme.colors.backgroundAction,
        }}
        value={value}
        onValueChange={disabled ? undefined : onValueChange}
      />
    </Box>
  )
}
