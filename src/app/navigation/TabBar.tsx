import { selectionAsync } from 'expo-haptics'
import React, { ComponentProps, memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { TapGestureHandler, TapGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import {
  cancelAnimation,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from 'react-native-reanimated'
import { SvgProps } from 'react-native-svg'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import SwapTabButtonBgSVG from 'src/assets/backgrounds/swap-tab-button-bg.svg'
import { AnimatedBox, Box } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { dimensions } from 'src/styles/sizing'
import { theme } from 'src/styles/theme'

export const TAB_NAVIGATOR_HEIGHT = 72

const SWAP_BUTTON_CONTAINER_WIDTH = dimensions.fullWidth / 3 + theme.spacing.lg

// Must be exact to match SVG bg
export const SWAP_BUTTON_HEIGHT = 56
const SWAP_BUTTON_WIDTH = 108
const SWAP_BUTTON_BG_WIDTH = 164
const SWAP_BUTTON_BG_HEIGHT = 58

export const TabBarButton = memo(
  ({
    focused,
    color,
    IconFilled,
    Icon,
    ...rest
  }: {
    focused: boolean
    color: string
    IconFilled: React.FC<SvgProps>
    Icon: React.FC<SvgProps>
  } & ComponentProps<typeof Box>) => {
    const appTheme = useAppTheme()

    return (
      <Box
        alignItems="center"
        flex={1}
        justifyContent="center"
        mb="xs"
        position="relative"
        {...rest}>
        {focused ? (
          <IconFilled color={appTheme.colors.userThemeColor} height={appTheme.iconSizes.lg} />
        ) : (
          <Icon color={color} height={appTheme.iconSizes.lg} />
        )}
        {/* bottom positioning is calculated based on the padding in the TabBar to minimize the icon shifting when selecting a tab. */}
        <Box
          backgroundColor="userThemeColor"
          borderRadius="full"
          bottom={-1 * appTheme.spacing.xxs}
          height={4}
          opacity={focused ? 1 : 0}
          width={4}
        />
      </Box>
    )
  }
)

type PressableScale = {
  /**
   * The value to scale to when the Pressable is being pressed.
   * @default 0.95
   */
  activeScale?: number
} & WithSpringConfig

export const SwapTabBarButton = memo(({ activeScale = 0.95 }: PressableScale) => {
  const { t } = useTranslation()
  const appTheme = useAppTheme()
  const dispatch = useAppDispatch()

  const onPress = useCallback(() => {
    selectionAsync()
    dispatch(openModal({ name: ModalName.Swap }))
  }, [dispatch])

  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }), [scale])
  const onGestureEvent = useAnimatedGestureHandler<TapGestureHandlerGestureEvent>({
    onStart: () => {
      cancelAnimation(scale)
      scale.value = withSpring(activeScale)
    },
    onEnd: () => {
      runOnJS(onPress)()
    },
    onFinish: () => {
      cancelAnimation(scale)
      scale.value = withSpring(1)
    },
  })

  return (
    <Box
      alignItems="center"
      pointerEvents="box-none"
      position="relative"
      width={SWAP_BUTTON_CONTAINER_WIDTH}>
      {/* SVG that follows the rounded shape of the swap button, placed below */}
      <SwapTabButtonBg
        bottom={TAB_NAVIGATOR_HEIGHT - SWAP_BUTTON_BG_HEIGHT}
        color={appTheme.colors.background0}
        position="absolute"
      />
      {/* Actual swap button with scale change */}
      <TapGestureHandler onGestureEvent={onGestureEvent}>
        <AnimatedBox
          alignItems="center"
          backgroundColor="userThemeMagenta"
          height={SWAP_BUTTON_HEIGHT}
          justifyContent="center"
          position="absolute"
          style={[styles.swapButton, animatedStyle]}
          top={-1 * (TAB_NAVIGATOR_HEIGHT - SWAP_BUTTON_HEIGHT + theme.spacing.xxxs)}
          width={SWAP_BUTTON_WIDTH}>
          <Text color="textOnBrightPrimary" variant="buttonLabelMedium">
            {t('Swap')}
          </Text>
        </AnimatedBox>
      </TapGestureHandler>
    </Box>
  )
})

/** SVG that follows the rounded shape of the swap button to create an edge, and make it "float". */
const SwapTabButtonBg = memo(
  ({
    color,
    width = SWAP_BUTTON_BG_WIDTH,
    ...props
  }: { color: string; width?: number } & ComponentProps<typeof Box>) => {
    return (
      <Box {...props}>
        <SwapTabButtonBgSVG color={color} width={width} />
      </Box>
    )
  }
)

const styles = StyleSheet.create({
  swapButton: {
    borderRadius: 100,
  },
})
