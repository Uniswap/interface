import React, { ReactElement } from 'react'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components-uds/TouchableArea'

import { ShadowProps } from '@shopify/restyle'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { ButtonProps } from 'src/components/buttons/Button'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'

const SHADOW_OFFSET: ShadowProps<Theme>['shadowOffset'] = { width: 0, height: 2 }

type GradientButtonProps = ButtonProps & {
  label?: string
  icon?: ReactElement
  textVariant?: keyof Theme['textVariants']
  textColor?: keyof Theme['colors']
}

// TODO: make this a more extensible component for use throughout the app
export function GradientButton({
  icon,
  onPress,
  textColor = 'accentTextLightPrimary',
  label,
  textVariant,
  disabled,
  height,
  p,
  px,
  py,
  ...rest
}: GradientButtonProps) {
  const theme = useAppTheme()

  return (
    <TouchableArea
      alignItems="center"
      bg="userThemeColor"
      borderRadius="md"
      disabled={disabled}
      height={height}
      justifyContent="center"
      opacity={disabled ? 0.6 : 1}
      shadowColor="black"
      shadowOffset={SHADOW_OFFSET}
      shadowOpacity={0.1}
      shadowRadius={24}
      onPress={onPress}
      {...rest}>
      {icon}
      {label && (
        <Box px={px || p || 'none'} py={py || p || 'none'}>
          <Text
            style={{ color: theme.colors[textColor] }}
            textAlign="center"
            variant={textVariant ?? 'mediumLabel'}>
            {label}
          </Text>
        </Box>
      )}
      {/* TODO: fix gradient definition so it fills space properly (right now needs 200% height on rect) */}
      <Flex borderRadius="md" height="100%" overflow="hidden" position="absolute" width="100%">
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
    </TouchableArea>
  )
}
