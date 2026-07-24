import React, { useMemo, useRef } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { cancelAnimation, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { AnimatedTouchableArea, useSporeColors } from 'ui/src'
import { SwapDotted } from 'ui/src/components/icons'
import { iconSizes, spacing } from 'ui/src/theme'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useHighestBalanceNativeCurrencyId } from 'uniswap/src/features/portfolio/balances/hooks'
import { useHapticFeedback } from 'uniswap/src/features/settings/useHapticFeedback/useHapticFeedback'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { selectFilteredChainIds } from 'uniswap/src/features/transactions/swap/state/selectors'
import { prepareSwapFormState } from 'uniswap/src/features/transactions/types/transactionState'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useEvent } from 'utilities/src/react/hooks'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

const ACTIVE_SCALE = 0.96
const LONG_PRESS_HAPTIC_DELAY = 200 // ms - faster than default long press (usually 500ms)
const LONG_PRESS_OPEN_DELAY = 500 // ms - deliberate hold before the radial menu opens
const LONG_PRESS_MAX_DISTANCE = 24 // dp of finger drift tolerated during the hold

const springConfig = { damping: 15, stiffness: 300 }
const shadowOffset = { width: 0, height: 6 }

interface SwapButtonProps {
  onLongPress: () => void
  onClose?: () => void
}

export function SwapButton({ onLongPress, onClose }: SwapButtonProps): JSX.Element {
  const colors = useSporeColors()
  const { defaultChainId } = useEnabledChains()
  const { hapticFeedback } = useHapticFeedback()
  const { navigate } = useAppStackNavigation()

  const hasTriggeredLongPressHaptic = useRef(false)
  const didLongPress = useRef(false)

  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const persistedFilteredChainIds = useSelector(selectFilteredChainIds)
  const inputCurrencyId = useHighestBalanceNativeCurrencyId({
    evmAddress: activeAccountAddress,
    chainId: persistedFilteredChainIds?.[CurrencyField.INPUT],
  })

  const onPress = useEvent(async () => {
    // A completed long-press already opened the radial menu; don't also navigate to Swap.
    if (didLongPress.current) {
      return
    }

    onClose?.()

    navigate(
      ModalName.Swap,
      prepareSwapFormState({
        inputCurrencyId,
        defaultChainId,
        filteredChainIdsOverride: persistedFilteredChainIds,
      }),
    )

    if (!hasTriggeredLongPressHaptic.current) {
      await hapticFeedback.light()
    }
  })

  const scale = useSharedValue(1)
  // reanimated 4 returns an AnimatedStyleHandle, accepted by the animated component at runtime.
  const animatedStyle = useAnimatedStyle(
    () => ({ transform: [{ scale: scale.value }] }),
    [scale],
  ) as unknown as StyleProp<ViewStyle>

  const handleTouchBegin = useEvent(() => {
    didLongPress.current = false
    hasTriggeredLongPressHaptic.current = false
    cancelAnimation(scale)
    scale.value = withSpring(ACTIVE_SCALE, springConfig)
  })

  const handleTouchFinalize = useEvent(() => {
    scale.value = withSpring(1, springConfig)
  })

  const handleLongPressHaptic = useEvent(async () => {
    hasTriggeredLongPressHaptic.current = true
    await hapticFeedback.success()
  })

  const handleOpenMenu = useEvent(() => {
    didLongPress.current = true
    onLongPress()
  })

  // External gesture, not Pressable onLongPress: TouchableArea's RNGH Pressable self-cancels on press-state re-renders (Android).
  const longPressGesture = useMemo(() => {
    const hapticGesture = Gesture.LongPress()
      .minDuration(LONG_PRESS_HAPTIC_DELAY)
      .maxDistance(LONG_PRESS_MAX_DISTANCE)
      .runOnJS(true)
      .onStart(handleLongPressHaptic)
    const openGesture = Gesture.LongPress()
      .minDuration(LONG_PRESS_OPEN_DELAY)
      .maxDistance(LONG_PRESS_MAX_DISTANCE)
      .runOnJS(true)
      .onBegin(handleTouchBegin)
      .onStart(handleOpenMenu)
      .onFinalize(handleTouchFinalize)
    return Gesture.Simultaneous(openGesture, hapticGesture)
  }, [handleLongPressHaptic, handleTouchBegin, handleOpenMenu, handleTouchFinalize])

  return (
    <GestureDetector gesture={longPressGesture}>
      <Trace logPress element={ElementName.Swap}>
        <AnimatedTouchableArea
          style={animatedStyle}
          testID={ElementName.Swap}
          activeOpacity={1}
          borderRadius="$roundedFull"
          backgroundColor="$accent1"
          px="$spacing24"
          alignItems="center"
          justifyContent="center"
          height="100%"
          shadowColor="$shadowColor"
          shadowOffset={shadowOffset}
          shadowRadius={spacing.spacing12}
          onPress={onPress}
        >
          <SwapDotted size={iconSizes.icon28} color={colors.white.val} />
        </AnimatedTouchableArea>
      </Trace>
    </GestureDetector>
  )
}
