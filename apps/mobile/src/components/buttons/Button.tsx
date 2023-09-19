import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'
import React, { memo } from 'react'
import { SvgProps } from 'react-native-svg'
import { useAppTheme } from 'src/app/hooks'
import { getButtonProperties } from 'src/components/buttons/utils'
import { DeprecatedMobileOnlyFlex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { TouchableArea, withAnimated } from 'ui/src'

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
  CustomIcon?: JSX.Element
  emphasis?: ButtonEmphasis
  disabled?: boolean
  fill?: boolean // flex=1
  allowFontScaling?: boolean
  hapticFeedback?: boolean
  hapticStyle?: ImpactFeedbackStyle
  onPress?: () => void
  onPressIn?: () => void
  onLongPress?: () => void
}

const _Button = ({
  CustomIcon,
  IconName,
  allowFontScaling,
  disabled = false,
  emphasis = ButtonEmphasis.Primary,
  fill,
  testID,
  hapticFeedback = true,
  hapticStyle,
  label,
  onLongPress,
  onPress,
  onPressIn,
  size = ButtonSize.Medium,
}: ButtonProps & {
  testID?: string
}): JSX.Element => {
  // TODO(MOB-1274): refactor Button to remove useAppTheme, Restyle Flex, Restyle Text
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

  const onPressHandler = async (): Promise<void> => {
    if (!onPress) return

    if (hapticFeedback) {
      await impactAsync(hapticStyle)
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
      // MOB-1365: until we convert this over to shared Button
      backgroundColor={backgroundColor === 'none' ? '$transparent' : `$${backgroundColor}`}
      borderColor={borderColor === 'none' ? '$transparent' : `$${borderColor}`}
      borderRadius={`$${borderRadius}`}
      borderWidth={1}
      disabled={disabled}
      flex={fill ? 1 : undefined}
      opacity={!disabled ? 1 : 0.4}
      testID={testID}
      onLongPress={onLongPress}
      onPress={onPressHandler}
      onPressIn={onPressIn}>
      <DeprecatedMobileOnlyFlex
        row
        alignItems="center"
        gap={iconPadding}
        px={paddingX}
        py={paddingY}>
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
      </DeprecatedMobileOnlyFlex>
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
