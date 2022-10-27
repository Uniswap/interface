import React, { memo, ReactElement } from 'react'
import Svg, { Defs, RadialGradient, Rect, Stop, SvgProps } from 'react-native-svg'
import { useAppTheme } from 'src/app/hooks'
import { withAnimated } from 'src/components/animated'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { getButtonProperties } from 'src/components/buttons/utils'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'

export enum ButtonSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

export enum ButtonEmphasis {
  Primary = 'primary',
  Secondary = 'secondary',
  Tertiary = 'tertiary',
  Detrimental = 'detrimental',
  Warning = 'warning',
}

interface ButtonProps {
  name?: string
  label?: string
  size?: ButtonSize
  /** this is the preferred way of passing in an icon. It is just the name of the SVG file */
  IconName?: React.FC<SvgProps>
  /** in the event that a custom icon is necessary this prop can be used instead of the IconName */
  CustomIcon?: ReactElement
  emphasis?: ButtonEmphasis
  disabled?: boolean
  fill?: boolean // flex=1
  noTextScaling?: boolean
  onPress?: () => void
  onPressIn?: () => void
  onLongPress?: () => void
}

const _Button = ({
  name,
  noTextScaling = false,
  label,
  IconName,
  CustomIcon,
  size = ButtonSize.Medium,
  emphasis = ButtonEmphasis.Primary,
  disabled = false,
  fill,
  onPress,
  onPressIn,
  onLongPress,
}: ButtonProps) => {
  const theme = useAppTheme()

  const {
    backgroundColor,
    textColor,
    textVariant,
    paddingX,
    paddingY,
    borderRadius,
    borderColor,
    iconPadding,
    iconSize,
  } = getButtonProperties(emphasis, size)

  const icon = IconName ? (
    <IconName
      color={theme.colors[textColor]}
      height={theme.iconSizes[iconSize]}
      strokeWidth={2}
      width={theme.iconSizes[iconSize]}
    />
  ) : (
    CustomIcon ?? null
  )

  return (
    <TouchableArea
      alignItems="center"
      backgroundColor={backgroundColor}
      borderColor={borderColor}
      borderRadius={borderRadius}
      borderWidth={1}
      disabled={disabled}
      flex={fill ? 1 : undefined}
      name={name}
      opacity={!disabled ? 1 : 0.4}
      testID={name}
      onLongPress={onLongPress}
      onPress={onPress}
      onPressIn={onPressIn}>
      <Flex centered row gap={iconPadding} px={paddingX} py={paddingY}>
        {icon}
        {label && (
          <Text
            color={textColor}
            noTextScaling={noTextScaling}
            textAlign="center"
            variant={textVariant}>
            {label}
          </Text>
        )}
      </Flex>
      {/* TODO: fix gradient definition so it fills space properly (right now needs 200% height on rect) */}
      {emphasis === ButtonEmphasis.Primary && label ? (
        <Flex
          borderRadius={borderRadius}
          height="100%"
          overflow="hidden"
          position="absolute"
          width="100%">
          <Svg height="100%" width="100%">
            <Defs>
              <RadialGradient cy="0" id="background" rx="0.5" ry="0.5">
                <Stop offset="0" stopColor={theme.colors.white} stopOpacity="0.5" />
                <Stop offset="1" stopColor={theme.colors.white} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect fill="url(#background)" height="200%" opacity={1} width="100%" x="0" y="0" />
          </Svg>
        </Flex>
      ) : null}
    </TouchableArea>
  )
}

export const Button = memo(_Button)

export const AnimatedButton = withAnimated(Button)
