import { color as restyleColor, ColorProps, createRestyleComponent } from '@shopify/restyle'
import React, { ComponentProps } from 'react'
import { SvgProps } from 'react-native-svg'
import ArrowDownSVG from 'src/assets/icons/arrow-down.svg'
import { Button } from 'src/components/buttons/Button'
import { IconButton } from 'src/components/buttons/IconButton'
import { Theme } from 'src/styles/theme'

const ICON_SIZE = 20

const ArrowDown = createRestyleComponent<ColorProps<Theme> & Omit<SvgProps, 'color'>, Theme>(
  [restyleColor],
  ArrowDownSVG
)

type ArrowDownButtonProps = Pick<ComponentProps<typeof Button>, 'disabled' | 'name' | 'onPress'>

export function TransferArrowButton({ name, onPress, disabled }: ArrowDownButtonProps) {
  return (
    <IconButton
      alignItems="center"
      alignSelf="center"
      bg="backgroundSurface"
      borderColor="backgroundBackdrop"
      borderRadius="md"
      borderWidth={4}
      disabled={disabled}
      icon={<ArrowDown color="textSecondary" height={ICON_SIZE} width={ICON_SIZE} />}
      justifyContent="center"
      name={name}
      onPress={onPress}
    />
  )
}
