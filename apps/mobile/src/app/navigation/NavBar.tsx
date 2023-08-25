import { ShadowProps, useResponsiveProp } from '@shopify/restyle'
import { SharedEventName } from '@uniswap/analytics-events'
import { BlurView } from 'expo-blur'
import { impactAsync } from 'expo-haptics'
import React, { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Dimensions, StyleSheet } from 'react-native'
import { TapGestureHandler, TapGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import {
  cancelAnimation,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { pulseAnimation } from 'src/components/buttons/utils'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { AnimatedBox, AnimatedFlex, Box, Flex, FlexProps } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { IS_ANDROID, IS_IOS } from 'src/constants/globals'
import { useIsDarkMode } from 'src/features/appearance/hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { prepareSwapFormState } from 'src/features/transactions/swap/utils'
import { Screens } from 'src/screens/Screens'
import SearchIcon from 'ui/src/assets/icons/search.svg'
import { Theme } from 'ui/src/theme/restyle'
import { useHighestBalanceNativeCurrencyId } from 'wallet/src/features/dataApi/balances'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

export const NAV_BAR_HEIGHT_XS = 52
export const NAV_BAR_HEIGHT_SM = 72

export const SWAP_BUTTON_HEIGHT = 56
const SWAP_BUTTON_SHADOW_OFFSET: ShadowProps<Theme>['shadowOffset'] = { width: 0, height: 4 }

function sendSwapPressAnalyticsEvent(): void {
  sendMobileAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
    screen: Screens.Home,
    element: ElementName.Swap,
  })
}

export function NavBar(): JSX.Element {
  const insets = useSafeAreaInsets()
  const theme = useAppTheme()
  const isDarkMode = useIsDarkMode()
  const screenHeight = Dimensions.get('screen').height

  const BUTTONS_OFFSET =
    useResponsiveProp({ xs: theme.spacing.spacing24, sm: theme.spacing.none }) ?? theme.spacing.none

  return (
    <>
      <Box pointerEvents="none" style={StyleSheet.absoluteFill}>
        <GradientBackground overflow="hidden">
          <Svg height={screenHeight} opacity={isDarkMode ? '1' : '0.3'} width="100%">
            <Defs>
              <LinearGradient id="background" x1="0%" x2="0%" y1="85%" y2="100%">
                <Stop offset="0" stopColor={theme.colors.sporeBlack} stopOpacity="0" />
                <Stop offset="1" stopColor={theme.colors.sporeBlack} stopOpacity="0.5" />
              </LinearGradient>
            </Defs>
            <Rect fill="url(#background)" height="100%" opacity={1} width="100%" x="0" y="0" />
          </Svg>
        </GradientBackground>
      </Box>
      <Flex
        row
        alignItems="center"
        bottom={0}
        gap="none"
        justifyContent="flex-end"
        left={0}
        pointerEvents="box-none"
        position="absolute"
        right={0}
        style={{ paddingBottom: insets.bottom + BUTTONS_OFFSET }}>
        <Flex
          row
          alignItems="center"
          flex={1}
          gap="spacing12"
          justifyContent="space-between"
          mb={IS_ANDROID ? 'spacing8' : 'none'}
          mx="spacing24"
          pointerEvents="auto">
          <ExploreTabBarButton />
          <SwapFAB />
        </Flex>
      </Flex>
    </>
  )
}

type SwapTabBarButtonProps = {
  /**
   * The value to scale to when the Pressable is being pressed.
   * @default 0.96
   */
  activeScale?: number
}

const SwapFAB = memo(function _SwapFAB({ activeScale = 0.96 }: SwapTabBarButtonProps) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const theme = useAppTheme()
  const isDarkMode = useIsDarkMode()

  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const inputCurrencyId = useHighestBalanceNativeCurrencyId(activeAccountAddress)

  const onPress = useCallback(async () => {
    dispatch(
      openModal({
        name: ModalName.Swap,
        initialState: prepareSwapFormState({ inputCurrencyId }),
      })
    )

    await impactAsync()
  }, [dispatch, inputCurrencyId])

  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }), [scale])
  const onGestureEvent = useAnimatedGestureHandler<TapGestureHandlerGestureEvent>({
    onStart: () => {
      cancelAnimation(scale)
      scale.value = pulseAnimation(activeScale)
    },
    onEnd: () => {
      runOnJS(onPress)()
      runOnJS(sendSwapPressAnalyticsEvent)()
    },
  })

  return (
    <Box alignItems="center" bg="none" pointerEvents="box-none" position="relative">
      <TapGestureHandler onGestureEvent={onGestureEvent}>
        <AnimatedBox
          alignItems="center"
          height={SWAP_BUTTON_HEIGHT}
          justifyContent="center"
          pointerEvents="auto"
          px="spacing24"
          py="spacing16"
          shadowColor="DEP_shadowBranded"
          shadowOffset={SWAP_BUTTON_SHADOW_OFFSET}
          shadowOpacity={isDarkMode ? 0.6 : 0.4}
          shadowRadius={theme.borderRadii.rounded20}
          style={[animatedStyle]}>
          <Box
            borderRadius="rounded32"
            bottom={0}
            left={0}
            overflow="hidden"
            pointerEvents="auto"
            position="absolute"
            right={0}
            top={0}>
            <Svg height="100%" width="100%">
              <Defs>
                <LinearGradient id="background" x1="0%" x2="0%" y1="0%" y2="100%">
                  <Stop offset="0" stopColor="#F160F9" stopOpacity="1" />
                  <Stop offset="1" stopColor="#e14ee9" stopOpacity="1" />
                </LinearGradient>
              </Defs>
              <Rect fill="url(#background)" height="100%" opacity={1} width="100%" x="0" y="0" />
            </Svg>
          </Box>
          <Text color="sporeWhite" variant="buttonLabelMedium">
            {t('Swap')}
          </Text>
        </AnimatedBox>
      </TapGestureHandler>
    </Box>
  )
})

type ExploreTabBarButtonProps = {
  /**
   * The value to scale to when the Pressable is being pressed.
   * @default 0.98
   */
  activeScale?: number
}

function ExploreTabBarButton({ activeScale = 0.98 }: ExploreTabBarButtonProps): JSX.Element {
  const dispatch = useAppDispatch()
  const theme = useAppTheme()
  const isDarkMode = useIsDarkMode()
  const { t } = useTranslation()

  const onPress = (): void => {
    dispatch(openModal({ name: ModalName.Explore }))
  }
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }), [scale])
  const onGestureEvent = useAnimatedGestureHandler<TapGestureHandlerGestureEvent>({
    onStart: () => {
      cancelAnimation(scale)
      scale.value = pulseAnimation(activeScale)
    },
    onEnd: () => {
      runOnJS(onPress)()
    },
  })

  const contentProps: FlexProps = IS_IOS
    ? {
        bg: 'surface2',
        opacity: isDarkMode ? 0.6 : 0.8,
      }
    : {
        bg: 'surface1',
        borderWidth: 1,
        borderColor: 'surface3',
      }

  return (
    <TouchableArea
      hapticFeedback
      activeOpacity={1}
      style={[styles.searchBar, { borderRadius: theme.borderRadii.roundedFull }]}
      onPress={onPress}>
      <TapGestureHandler onGestureEvent={onGestureEvent}>
        <AnimatedFlex borderRadius="roundedFull" overflow="hidden" style={animatedStyle}>
          <BlurView intensity={IS_IOS ? 100 : 0}>
            <Flex
              {...contentProps}
              grow
              row
              alignItems="center"
              borderRadius="roundedFull"
              flex={1}
              gap="spacing8"
              justifyContent="flex-start"
              p="spacing16"
              shadowColor={isDarkMode ? 'surface2' : 'neutral3'}
              shadowOffset={SWAP_BUTTON_SHADOW_OFFSET}
              shadowOpacity={isDarkMode ? 0.6 : 0.4}
              shadowRadius={theme.borderRadii.rounded20}>
              <SearchIcon color={theme.colors.neutral2} />
              <Text color="neutral1" variant="bodyLarge">
                {t('Search web3')}
              </Text>
            </Flex>
          </BlurView>
        </AnimatedFlex>
      </TapGestureHandler>
    </TouchableArea>
  )
}

const styles = StyleSheet.create({
  searchBar: {
    flexGrow: 1,
  },
})
