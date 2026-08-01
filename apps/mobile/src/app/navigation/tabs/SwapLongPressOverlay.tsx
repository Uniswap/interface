import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { BlurView } from 'expo-blur'
import { type ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, StyleSheet, type ViewStyle } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { ESTIMATED_BOTTOM_TABS_HEIGHT } from 'src/app/navigation/tabs/CustomTabBar/constants'
import { SwapButton } from 'src/app/navigation/tabs/SwapButton'
import { useOpenReceiveModal } from 'src/features/modals/hooks/useOpenReceiveModal'
import { openModal } from 'src/features/modals/modalSlice'
import { Flex, Text, TouchableArea, useIsDarkMode, useSporeColors } from 'ui/src'
import { Bank, Buy, ReceiveAlt, SendAction } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { MobileEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { useEvent } from 'utilities/src/react/hooks'

const ANIMATION_DURATION = 200
const BASE_DELAY = 40

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

function AnimatedContainer({
  enteringDelay,
  exitingDelay,
  children,
  style,
  exitingDuration = ANIMATION_DURATION,
}: {
  enteringDelay: number
  exitingDelay: number
  children: ReactNode
  style?: ViewStyle
  exitingDuration?: number
}): JSX.Element {
  return (
    <Animated.View
      entering={FadeIn.duration(ANIMATION_DURATION).delay(enteringDelay)}
      exiting={FadeOut.duration(exitingDuration).delay(exitingDelay)}
      style={style}
    >
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  blurView: {
    height: '100%',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
  },
})
interface SwapLongPressOverlayProps {
  isVisible: boolean
  onClose: () => void
  onSwapLongPress: () => void
}

export function SwapLongPressOverlay({
  isVisible,
  onClose,
  onSwapLongPress,
}: SwapLongPressOverlayProps): JSX.Element | null {
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()
  const insets = useAppInsets()
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const openReceiveModal = useOpenReceiveModal()
  const { isTestnetModeEnabled } = useEnabledChains()
  const disableForKorea = useFeatureFlag(FeatureFlags.DisableFiatOnRampKorea)

  const onBuyPress = useEvent(async (): Promise<void> => {
    sendAnalyticsEvent(MobileEventName.SwapLongPress, { element: 'buy' })

    if (isTestnetModeEnabled) {
      navigate(ModalName.TestnetMode, {
        unsupported: true,
        descriptionCopy: t('tdp.noTestnetSupportDescription'),
      })
      return
    }
    disableForKorea
      ? navigate(ModalName.KoreaCexTransferInfoModal)
      : dispatch(
          openModal({
            name: ModalName.FiatOnRampAggregator,
          }),
        )

    onClose()
  })

  const onSellPress = useEvent(() => {
    sendAnalyticsEvent(MobileEventName.SwapLongPress, { element: 'sell' })

    if (isTestnetModeEnabled) {
      navigate(ModalName.TestnetMode, {
        unsupported: true,
        descriptionCopy: t('tdp.noTestnetSupportDescription'),
      })
      return
    }
    disableForKorea
      ? navigate(ModalName.KoreaCexTransferInfoModal)
      : dispatch(
          openModal({
            name: ModalName.FiatOnRampAggregator,
            initialState: {
              isOfframp: true,
            },
          }),
        )

    onClose()
  })

  const onReceivePress = useEvent(() => {
    sendAnalyticsEvent(MobileEventName.SwapLongPress, { element: 'receive' })

    openReceiveModal()
    onClose()
  })

  const onSendPress = useEvent(() => {
    sendAnalyticsEvent(MobileEventName.SwapLongPress, { element: 'send' })

    dispatch(openModal({ name: ModalName.Send }))
    onClose()
  })

  const swapMenuItems: { title: string; onPress: () => void; icon: ReactNode }[] = useMemo(
    () => [
      {
        title: t('common.button.receive'),
        onPress: onReceivePress,
        icon: <ReceiveAlt size={iconSizes.icon28} color={colors.accent1.val} />,
      },
      {
        title: t('common.button.send'),
        onPress: onSendPress,
        icon: <SendAction size={iconSizes.icon28} color={colors.accent1.val} />,
      },
      {
        title: t('common.button.buy'),
        onPress: onBuyPress,
        icon: <Buy size={iconSizes.icon28} color={colors.accent1.val} />,
      },
      {
        title: t('common.button.sell'),
        onPress: onSellPress,
        icon: <Bank size={iconSizes.icon28} color={colors.accent1.val} />,
      },
    ],
    [t, onReceivePress, onSendPress, onBuyPress, onSellPress, colors.accent1.val],
  )

  const NUM_OF_SWAP_MENU_ITEMS = swapMenuItems.length
  const TOTAL_DELAY_FOR_EXIT_FROM_MENU_ITEMS = NUM_OF_SWAP_MENU_ITEMS * BASE_DELAY

  // Used for main container and SwapButton
  const DELAY_FOR_MAIN_EXIT = TOTAL_DELAY_FOR_EXIT_FROM_MENU_ITEMS + ANIMATION_DURATION / 2

  // We want to start animating the text out just before the main animation starts
  const DELAY_FOR_SWAP_TEXT_EXIT = DELAY_FOR_MAIN_EXIT - ANIMATION_DURATION / 4

  if (!isVisible) {
    return null
  }

  const overlayContent = (
    <TouchableArea activeOpacity={1} flex={1} justifyContent="flex-end" alignItems="flex-end" onPress={onClose}>
      <Flex position="absolute" bottom={insets.bottom} right={0} alignItems="flex-end" gap="$spacing16" mr="$spacing24">
        {swapMenuItems.map((item, i) => {
          // Items animate in sequentially top-down after the initial animation, and out bottom-up.
          const enteringDelay = ANIMATION_DURATION + (NUM_OF_SWAP_MENU_ITEMS - i) * BASE_DELAY
          const exitingDelay = i * BASE_DELAY

          return (
            <AnimatedContainer key={item.title} enteringDelay={enteringDelay} exitingDelay={exitingDelay}>
              <MenuItem title={item.title} icon={item.icon} onPress={item.onPress} />
            </AnimatedContainer>
          )
        })}

        <Flex height={ESTIMATED_BOTTOM_TABS_HEIGHT} alignItems="center" gap="$spacing24" flexDirection="row">
          <AnimatedContainer enteringDelay={ANIMATION_DURATION} exitingDelay={DELAY_FOR_SWAP_TEXT_EXIT}>
            <Text variant="buttonLabel2" color="$neutral1" textAlign="right">
              {t('common.button.swap')}
            </Text>
          </AnimatedContainer>
          {/* No entering animation so it reads as the same button that was long-pressed on HomeScreen */}
          <AnimatedContainer enteringDelay={0} exitingDelay={DELAY_FOR_MAIN_EXIT} exitingDuration={0}>
            <SwapButton onLongPress={onSwapLongPress} onClose={onClose} />
          </AnimatedContainer>
        </Flex>
      </Flex>
    </TouchableArea>
  )

  // Android: expo-blur can't blur here (needs a BlurTargetView), so use a near-opaque scrim.
  if (Platform.OS === 'android') {
    return (
      <Animated.View
        entering={FadeIn.duration(ANIMATION_DURATION)}
        exiting={FadeOut.duration(ANIMATION_DURATION).delay(DELAY_FOR_MAIN_EXIT)}
        style={[styles.blurView, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)' }]}
      >
        {overlayContent}
      </Animated.View>
    )
  }

  return (
    <AnimatedBlurView
      entering={FadeIn.duration(ANIMATION_DURATION)}
      exiting={FadeOut.duration(ANIMATION_DURATION).delay(DELAY_FOR_MAIN_EXIT)}
      intensity={60}
      tint={isDarkMode ? 'systemMaterialDark' : 'systemMaterialLight'}
      style={styles.blurView}
    >
      {overlayContent}
    </AnimatedBlurView>
  )
}

function MenuItem({ title, icon, onPress }: { title: string; icon: ReactNode; onPress: () => void }): JSX.Element {
  return (
    <TouchableArea borderRadius="$rounded20" onPress={onPress}>
      <Flex row alignItems="center" justifyContent="space-between" gap="$spacing24">
        <Text variant="buttonLabel2" color="$neutral1" textAlign="right">
          {title}
        </Text>
        <Flex
          borderRadius="$roundedFull"
          backgroundColor="$accent2"
          py="$spacing12"
          px="$spacing24"
          borderWidth="$spacing1"
          borderColor="$accent2Hovered"
        >
          {icon}
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
