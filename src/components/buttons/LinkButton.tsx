import React, { useMemo } from 'react'
import { useAppTheme } from 'src/app/hooks'
import { BaseButtonProps, TouchableArea } from 'src/components/buttons/TouchableArea'
import { Arrow } from 'src/components/icons/Arrow'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { iconSizes } from 'src/styles/sizing'
import { Theme } from 'src/styles/theme'
import { openUri } from 'src/utils/linking'
interface LinkButtonProps extends Omit<BaseButtonProps, 'onPress'> {
  label: string
  url: string
  openExternalBrowser?: boolean
  isSafeUri?: boolean
  color?: string
  iconColor?: string
  size?: number
  textVariant?: keyof Theme['textVariants']
}

export function LinkButton({
  url,
  label,
  textVariant,
  color,
  iconColor,
  openExternalBrowser = false,
  isSafeUri = false,
  size = iconSizes.md,
  justifyContent = 'center',
  ...rest
}: LinkButtonProps): JSX.Element {
  const theme = useAppTheme()
  const colorStyles = useMemo(() => {
    return color
      ? { style: { color } }
      : // if a hex color is not defined, don't give the Text component a style prop, because that will override its default behavior of using textPrimary when no color prop is defined
        {}
  }, [color])

  return (
    <TouchableArea
      onPress={(): Promise<void> => openUri(url, openExternalBrowser, isSafeUri)}
      {...rest}>
      <Flex row alignItems="center" gap="xxxs" justifyContent={justifyContent}>
        <Text {...colorStyles} variant={textVariant}>
          {label}
        </Text>
        <Arrow
          color={iconColor ?? color ?? theme.colors.textSecondary}
          direction="ne"
          size={size}
        />
      </Flex>
    </TouchableArea>
  )
}
