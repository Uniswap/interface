import React from 'react'
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
  isSafeUri?: boolean
  color?: keyof Theme['colors']
  iconColor?: keyof Theme['colors']
  size?: number
  textVariant?: keyof Theme['textVariants']
}

export function LinkButton({
  url,
  label,
  textVariant,
  color,
  iconColor,
  isSafeUri = false,
  size = iconSizes.md,
  justifyContent = 'center',
  ...rest
}: LinkButtonProps) {
  const theme = useAppTheme()
  return (
    <TouchableArea onPress={() => openUri(url, isSafeUri)} {...rest}>
      <Flex row alignItems="center" gap="xxxs" justifyContent={justifyContent}>
        <Text color={color} variant={textVariant}>
          {label}
        </Text>
        <Arrow
          color={
            (iconColor && theme.colors[iconColor]) ??
            (color && theme.colors[color]) ??
            theme.colors.textSecondary
          }
          direction="ne"
          size={size}
        />
      </Flex>
    </TouchableArea>
  )
}
