import { SharedEventName } from '@uniswap/analytics-events'
import { BlurView } from 'expo-blur'
import React, { memo, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, LayoutRectangle, StyleSheet } from 'react-native'
import { TapGestureHandler, TapGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import {
  cancelAnimation,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { pulseAnimation } from 'src/components/buttons/utils'
import { Flex, FlexProps, LinearGradient, Text, TouchableArea, useIsDarkMode, useSporeColors } from 'ui/src'
import { Search } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { borderRadii, fonts, opacify } from 'ui/src/theme'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useHighestBalanceNativeCurrencyId } from 'uniswap/src/features/dataApi/balances/balances'
import { useHapticFeedback } from 'uniswap/src/features/settings/useHapticFeedback/useHapticFeedback'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { selectFilteredChainIds } from 'uniswap/src/features/transactions/swap/state/selectors'
import { prepareSwapFormState } from 'uniswap/src/features/transactions/types/transactionState'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { CurrencyField } from 'uniswap/src/types/currency'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { isAndroid, isIOS } from 'utilities/src/platform'
import { setHasUsedExplore } from 'wallet/src/features/behaviorHistory/slice'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

const NAV_BAR_MARGIN_SIDES = 24
const NAV_BAR_GAP = 12

export const SWAP_BUTTON_HEIGHT = 56
const SWAP_BUTTON_SHADOW_OFFSET = { width: 0, height: 4 }

function sendSwapPressAnalyticsEvent(): void {
  sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
    screen: MobileScreens.Home,
    element: ElementName.Swap,
  })
}

export function NavBar(): JSX.Element {
  const insets = useAppInsets()
  const { width: screenWidth } = useSafeAreaFrame()
  const [isNarrow, setIsNarrow] = useState(false)
  const [exploreButtonLayout, setExploreButtonLayout] = useState<LayoutRectangle | null>(null)
  const [swapButtonLayout, setSwapButtonLayout] = useState<LayoutRectangle | null>(null)

  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to ignore isNarrow because of unknown reason
  useEffect(() => {
    if (isNarrow || !exploreButtonLayout?.width || !swapButtonLayout?.width) {
      return
    }

    // When the 2 buttons overflow, we set `isNarrow` to true and adjust the design accordingly.
    // To test this, you can use an iPhone Mini set to Spanish.
    setIsNarrow(exploreButtonLayout.width + swapButtonLayout.width + NAV_BAR_GAP + NAV_BAR_MARGIN_SIDES > screenWidth)
  }, [exploreButtonLayout?.width, swapButtonLayout?.width, screenWidth])

  const onExploreLayout = useCallback((e: LayoutChangeEvent) => setExploreButtonLayout(e.nativeEvent.layout), [])

  const onSwapLayout = useCallback((e: LayoutChangeEvent) => setSwapButtonLayout(e.nativeEvent.layout), [])

  return (
    <>
      <Flex opacity={isDarkMode ? 1 : 0.3} overflow="hidden" pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[opacify(50, colors.black.val), opacify(0, colors.black.val)]}
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
        style={{ paddingBottom: insets.bottom }}
      >
        <Flex
          fill
          row
          alignItems="center"
          gap={NAV_BAR_GAP}
          justifyContent="space-between"
          mb={isAndroid ? '$spacing8' : '$none'}
          mx={NAV_BAR_MARGIN_SIDES}
          pointerEvents="auto"
        >
          <ExploreTabBarButton isNarrow={isNarrow} onLayout={onExploreLayout} />
          <SwapFAB onSwapLayout={onSwapLayout} />
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
  onSwapLayout: (event: LayoutChangeEvent) => void
}

const SwapFAB = memo(function _SwapFAB({ activeScale = 0.96, onSwapLayout }: SwapTabBarButtonProps) {
  const { t } = useTranslation()
  const { defaultChainId } = useEnabledChains()
  const { hapticFeedback } = useHapticFeedback()
  const { navigate } = useAppStackNavigation()

  const isDarkMode = useIsDarkMode()
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const persistedFilteredChainIds = useSelector(selectFilteredChainIds)
  const inputCurrencyId = useHighestBalanceNativeCurrencyId({
    evmAddress: activeAccountAddress,
    chainId: persistedFilteredChainIds?.[CurrencyField.INPUT],
  })

  const onPress = useCallback(async () => {
    navigate(
      ModalName.Swap,
      prepareSwapFormState({
        inputCurrencyId,
        defaultChainId,
        filteredChainIdsOverride: persistedFilteredChainIds,
      }),
    )

    await hapticFeedback.light()
  }, [inputCurrencyId, defaultChainId, hapticFeedback, persistedFilteredChainIds, navigate])

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
    <Flex centered height={SWAP_BUTTON_HEIGHT} pointerEvents="box-none" position="relative" onLayout={onSwapLayout}>
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
          style={[animatedStyle]}
        >
          <Flex
            borderRadius="$rounded32"
            bottom={0}
            left={0}
            overflow="hidden"
            pointerEvents="auto"
            position="absolute"
            right={0}
            top={0}
            backgroundColor="$accent1"
          />
          <Text allowFontScaling={false} color="$white" numberOfLines={1} variant="buttonLabel1">
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
  isNarrow: boolean
  onLayout: (event: LayoutChangeEvent) => void
}

function ExploreTabBarButton({ activeScale = 0.98, onLayout, isNarrow }: ExploreTabBarButtonProps): JSX.Element {
  const dispatch = useDispatch()
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()
  const { t } = useTranslation()
  const { isTestnetModeEnabled } = useEnabledChains()
  const { navigate } = useAppStackNavigation()

  const onPress = (): void => {
    if (isTestnetModeEnabled) {
      navigate(ModalName.TestnetMode, { unsupported: true })
      return
    }
    navigate(ModalName.Explore)
    dispatch(setHasUsedExplore(true))
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

  const [height, setHeight] = useState<number | undefined>(undefined)

  const internalOnLayout = (e: LayoutChangeEvent): void => {
    setHeight(e.nativeEvent.layout.height)
    onLayout(e)
  }

  const Wrapper = isIOS ? BlurView : Flex

  return (
    <TouchableArea
      activeOpacity={1}
      style={[styles.searchBar, { borderRadius: borderRadii.roundedFull }]}
      dd-action-name={TestID.SearchTokensAndWallets}
    >
      <TapGestureHandler testID={TestID.SearchTokensAndWallets} onGestureEvent={onGestureEvent}>
        <AnimatedFlex
          borderRadius="$roundedFull"
          overflow="hidden"
          style={animatedStyle}
          width={isNarrow ? height : undefined}
          onLayout={internalOnLayout}
        >
          <Wrapper {...(isIOS ? { intensity: 100 } : {})}>
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
              shadowRadius={borderRadii.rounded20}
            >
              <Search color="$neutral2" size="$icon.24" />
              {isNarrow ? undefined : (
                <Text
                  allowFontScaling={false}
                  color="$neutral2"
                  numberOfLines={1}
                  pr="$spacing48"
                  style={{ lineHeight: fonts.body1.lineHeight }}
                  variant="body1"
                >
                  {t('common.input.search')}
                </Text>
              )}
            </Flex>
          </Wrapper>
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
