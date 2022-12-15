import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'
import React, { memo, ReactElement } from 'react'
import Svg, { Defs, LinearGradient, Rect, Stop, SvgProps } from 'react-native-svg'
import { useAppTheme } from 'src/app/hooks'
import { withAnimated } from 'src/components/animated'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { getButtonProperties } from 'src/components/buttons/utils'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { TelemetryEventProps } from 'src/features/telemetry/types'

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

type ButtonProps = {
  label?: string
  size?: ButtonSize
  /** this is the preferred way of passing in an icon. It is just the name of the SVG file */
  IconName?: React.FC<SvgProps>
  /** in the event that a custom icon is necessary this prop can be used instead of the IconName */
  CustomIcon?: ReactElement
  emphasis?: ButtonEmphasis
  disabled?: boolean
  fill?: boolean // flex=1
  allowFontScaling?: boolean
  hapticFeedback?: boolean
  hapticStyle?: ImpactFeedbackStyle
  onPress?: () => void
  onPressIn?: () => void
  onLongPress?: () => void
} & TelemetryEventProps

const _Button = ({
  CustomIcon,
  IconName,
  allowFontScaling,
  disabled = false,
  emphasis = ButtonEmphasis.Primary,
  eventName,
  events,
  fill,
  hapticFeedback = true,
  properties,
  hapticStyle,
  label,
  name,
  onLongPress,
  onPress,
  onPressIn,
  size = ButtonSize.Medium,
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

  const onPressHandler = () => {
    if (!onPress) return

    if (hapticFeedback) {
      impactAsync(hapticStyle)
    }
    onPress()
  }

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
      eventName={eventName}
      events={events}
      flex={fill ? 1 : undefined}
      name={name}
      opacity={!disabled ? 1 : 0.4}
      properties={properties}
      testID={name}
      onLongPress={onLongPress}
      onPress={onPressHandler}
      onPressIn={onPressIn}>
      {/* Absolutely positioned at -1 so because the button has 1 px border that needs to be covered by the gradient. */}
      {emphasis === ButtonEmphasis.Primary && label ? (
        <Flex
          borderRadius={borderRadius}
          height="100%"
          overflow="hidden"
          position="absolute"
          width="100%">
          <Svg height="100%" width="100%">
            <Defs>
              <LinearGradient id="background" x1="0%" x2="0%" y1="0%" y2="100%">
                <Stop offset="0" stopColor="#F160F9" stopOpacity="1" />
                <Stop offset="1" stopColor="#FB36D0" stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Rect fill="url(#background)" height="150%" opacity={1} width="100%" x="0" y="0" />
          </Svg>
        </Flex>
      ) : null}
      <Flex centered row gap={iconPadding} px={paddingX} py={paddingY}>
        {icon}
        {label && (
          <Text
            allowFontScaling={allowFontScaling}
            color={textColor}
            textAlign="center"
            variant={textVariant}>
            {label}
          </Text>
        )}
      </Flex>
    </TouchableArea>
  )
}

/**
 * Standard design system Button. By default emphasis is Primary and size is Medium.
 * The Figma designs will have the emphasis and size as part of the component properties.
 * If the Figma design has a button that looks similar to one of the variants but is not exactly the same please flag to designers before creating a button different from this one.
 *
 * This button handles Label + Icon, Label only, and Icon only. Pass the relevant props and it will handle the rendering for each case.
 */
export const Button = memo(_Button)

export const AnimatedButton = withAnimated(Button)
