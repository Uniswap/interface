import { SharedEventName } from '@uniswap/analytics-events'
import { BlurView } from 'expo-blur'
import { impactAsync } from 'expo-haptics'
import React, { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { TapGestureHandler, TapGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import {
  cancelAnimation,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { useAppDispatch } from 'src/app/hooks'
import { pulseAnimation } from 'src/components/buttons/utils'
import { openModal } from 'src/features/modals/modalSlice'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { Screens } from 'src/screens/Screens'
import {
  AnimatedFlex,
  Flex,
  FlexProps,
  Icons,
  LinearGradient,
  Text,
  TouchableArea,
  useDeviceInsets,
  useIsDarkMode,
  useSporeColors,
} from 'ui/src'
import { borderRadii, fonts } from 'ui/src/theme'
import { isAndroid, isIOS } from 'uniswap/src/utils/platform'
import { useHighestBalanceNativeCurrencyId } from 'wallet/src/features/dataApi/balances'
import { prepareSwapFormState } from 'wallet/src/features/transactions/swap/utils'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { ElementName, ModalName } from 'wallet/src/telemetry/constants'
import { opacify } from 'wallet/src/utils/colors'

export const NAV_BAR_HEIGHT_XS = 52
export const NAV_BAR_HEIGHT_SM = 72

export const SWAP_BUTTON_HEIGHT = 56
const SWAP_BUTTON_SHADOW_OFFSET = { width: 0, height: 4 }

function sendSwapPressAnalyticsEvent(): void {
  sendMobileAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
    screen: Screens.Home,
    element: ElementName.Swap,
  })
}

export function NavBar(): JSX.Element {
  const insets = useDeviceInsets()
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()

  return (
    <>
      <Flex
        opacity={isDarkMode ? 1 : 0.3}
        overflow="hidden"
        pointerEvents="none"
        style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[opacify(50, colors.sporeBlack.val), opacify(0, colors.sporeBlack.val)]}
          end={[0, 0.8]}
          height="100%"
          start={[0, 1]}
          width="100%"
        />
      </Flex>
      <Flex
        row
        alignItems="center"
        bottom={0}
        justifyContent="flex-end"
        left={0}
        pointerEvents="box-none"
        position="absolute"
        right={0}
        style={{ paddingBottom: insets.bottom }}>
        <Flex
          fill
          row
          alignItems="center"
          gap="$spacing12"
          justifyContent="space-between"
          mb={isAndroid ? '$spacing8' : '$none'}
          mx="$spacing24"
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
    <Flex centered height={SWAP_BUTTON_HEIGHT} pointerEvents="box-none" position="relative">
      <TapGestureHandler testID={ElementName.Swap} onGestureEvent={onGestureEvent}>
        <AnimatedFlex
          centered
          height="100%"
          pointerEvents="auto"
          px="$spacing24"
          py="$spacing16"
          shadowColor="$DEP_shadowBranded"
          shadowOffset={SWAP_BUTTON_SHADOW_OFFSET}
          shadowOpacity={isDarkMode ? 0.6 : 0.4}
          shadowRadius={borderRadii.rounded20}
          style={[animatedStyle]}>
          <Flex
            borderRadius="$rounded32"
            bottom={0}
            left={0}
            overflow="hidden"
            pointerEvents="auto"
            position="absolute"
            right={0}
            top={0}>
            <LinearGradient
              colors={['#F160F9', '#E14EE9']}
              end={[0, 1]}
              height="100%"
              start={[0, 0]}
              width="100%"
            />
          </Flex>
          <Text
            allowFontScaling={false}
            color="$sporeWhite"
            numberOfLines={1}
            variant="buttonLabel2">
            {t('common.button.swap')}
          </Text>
        </AnimatedFlex>
      </TapGestureHandler>
    </Flex>
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
  const colors = useSporeColors()
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

  const contentProps: FlexProps = isIOS
    ? {
        backgroundColor: '$surface2',
        opacity: isDarkMode ? 0.6 : 0.8,
      }
    : {
        backgroundColor: '$surface1',
        style: {
          borderWidth: 1,
          borderColor: colors.surface3.val,
        },
      }

  return (
    <TouchableArea
      hapticFeedback
      activeOpacity={1}
      style={[styles.searchBar, { borderRadius: borderRadii.roundedFull }]}
      onPress={onPress}>
      <TapGestureHandler
        testID={ElementName.SearchTokensAndWallets}
        onGestureEvent={onGestureEvent}>
        <AnimatedFlex borderRadius="$roundedFull" overflow="hidden" style={animatedStyle}>
          <BlurView intensity={isIOS ? 100 : 0}>
            <Flex
              {...contentProps}
              fill
              grow
              row
              alignItems="center"
              borderRadius="$roundedFull"
              gap="$spacing8"
              justifyContent="flex-start"
              p="$spacing16"
              shadowColor={isDarkMode ? '$surface2' : '$neutral3'}
              shadowOffset={SWAP_BUTTON_SHADOW_OFFSET}
              shadowOpacity={isDarkMode ? 0.6 : 0.4}
              shadowRadius={borderRadii.rounded20}>
              <Icons.Search color="$neutral2" size="$icon.24" />
              <Text
                allowFontScaling={false}
                color="$neutral2"
                numberOfLines={1}
                pr="$spacing48"
                style={{ lineHeight: fonts.body1.lineHeight }}
                variant="body1">
                {t('common.input.search')}
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
