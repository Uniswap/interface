import { ShadowProps } from '@shopify/restyle'
import React from 'react'
import { useTranslation } from 'react-i18next'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'

const SHADOW_OFFSET: ShadowProps<Theme>['shadowOffset'] = { width: 0, height: 2 }

export function SwapButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  return (
    <TouchableArea
      alignItems="center"
      bg="userThemeColor"
      borderRadius="xxl"
      justifyContent="center"
      shadowColor="black"
      shadowOffset={SHADOW_OFFSET}
      shadowOpacity={0.1}
      shadowRadius={24}
      onPress={onPress}>
      <Box px="lg" py="sm">
        <Text noTextScaling textAlign="center" variant="buttonLabelMedium">
          {t('Swap')}
        </Text>
      </Box>
      {/* TODO: fix gradient definition so it fills space properly (right now needs 200% height on rect) */}
      <Flex borderRadius="xxl" height="100%" overflow="hidden" position="absolute" width="100%">
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
