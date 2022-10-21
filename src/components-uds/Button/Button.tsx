import React, { ComponentProps, memo, ReactElement } from 'react'
import {
  getButtonBorderRadius,
  getButtonColor,
  getButtonPaddingX,
  getButtonPaddingY,
  getButtonTextColor,
  getButtonTextSizeVariant,
  getButtonType,
} from 'src/components-uds/Button/utils'
import { TouchableArea } from 'src/components-uds/TouchableArea'
import { withAnimated } from 'src/components/animated'
import { Box } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'

export enum ButtonType {
  Regular = 'regular',
  Icon = 'icon',
  Label = 'label',
}

export enum ButtonSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

export enum ButtonEmphasis {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
  Destructive = 'destructive',
  Warning = 'warning',
}

export enum ButtonState {
  Disabled = 'disabled',
  Enabled = 'enabled',
}

interface CommonButtonProps extends ComponentProps<typeof TouchableArea> {
  name?: string
  size: ButtonSize
  emphasis: ButtonEmphasis
  state: ButtonState
  onPress?: () => void
  onLongPress?: () => void
  noTextScaling?: boolean
  iconLabelSpacing?: keyof Theme['spacing']
}

interface ButtonWithLabel extends CommonButtonProps {
  label: string
  icon?: undefined
}

interface ButtonWithIcon extends CommonButtonProps {
  label?: undefined
  icon: ReactElement
}

interface ButtonWithIconAndLabel extends CommonButtonProps {
  label: string
  icon: ReactElement
}

export type ButtonProps = ButtonWithIconAndLabel | ButtonWithIcon | ButtonWithLabel

const _Button = ({
  name,
  noTextScaling = false,
  iconLabelSpacing,
  label,
  icon,
  size = ButtonSize.Medium,
  emphasis,
  state = ButtonState.Enabled,
  onPress,
  onLongPress,
  ...rest
}: ButtonProps) => {
  // is the button of type: label, icon, or regular (both)?
  // we derive ButtonType based on label and icon props because consumers of the button
  // shouldn't have to think about what type of button it is, they just need to know that
  // it needs either: a label, an icon, or both
  const buttonType = getButtonType(label, icon)

  const buttonColor = getButtonColor(emphasis)
  const textColor = getButtonTextColor(emphasis)
  const textVariant = getButtonTextSizeVariant(size)
  const paddingX = getButtonPaddingX(size, buttonType)
  const paddingY = getButtonPaddingY(size)
  const borderRadius = getButtonBorderRadius(size, buttonType)

  return (
    <TouchableArea
      alignItems="center"
      backgroundColor={buttonColor}
      borderColor="backgroundOutline"
      borderRadius={borderRadius}
      borderWidth={emphasis === ButtonEmphasis.Low ? 1 : 0}
      disabled={state === ButtonState.Disabled}
      flexDirection="row"
      justifyContent="center"
      name={name}
      opacity={state === ButtonState.Enabled ? 1 : 0.6}
      px={paddingX}
      py={paddingY}
      onLongPress={onLongPress}
      onPress={onPress}
      {...rest}>
      {icon && <Box mr={iconLabelSpacing ?? 'xs'}>{icon}</Box>}
      {buttonType !== ButtonType.Icon && (
        <Text
          color={textColor}
          noTextScaling={noTextScaling}
          textAlign="center"
          variant={textVariant}>
          {label}
        </Text>
      )}
    </TouchableArea>
  )
}

export const Button = memo(_Button)

export const AnimatedButton = withAnimated(Button)
