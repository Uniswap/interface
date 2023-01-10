import { SpacingProps, SpacingShorthandProps } from '@shopify/restyle'
import React, { PropsWithChildren, ReactElement } from 'react'
import { Switch as BaseSwitch, SwitchProps, ViewProps } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { Box } from 'src/components/layout/Box'
import { Theme } from 'src/styles/theme'

type RestyleProps = SpacingProps<Theme> & SpacingShorthandProps<Theme>

type Props = {
  value: boolean
  onValueChange: (newValue: boolean) => void
  disabled?: boolean
} & RestyleProps &
  ViewProps &
  SwitchProps

// A themed switch toggle
export function Switch({
  value,
  onValueChange,
  disabled,
  ...rest
}: PropsWithChildren<Props>): ReactElement {
  const theme = useAppTheme()

  return (
    <Box>
      <BaseSwitch
        ios_backgroundColor={theme.colors.background3}
        thumbColor={value ? theme.colors.accentAction : theme.colors.textSecondary}
        trackColor={{
          false: theme.colors.background3,
          true: theme.colors.background3,
        }}
        value={value}
        onValueChange={disabled ? undefined : onValueChange}
        {...rest}
      />
    </Box>
  )
}
