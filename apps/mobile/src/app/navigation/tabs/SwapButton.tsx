import { AnimatedTouchableArea, useSporeColors } from '@universe/mycelium'
import React, { useEffect, useRef } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { cancelAnimation, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { CoinConvert } from 'ui/src/components/icons'
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
const LONG_PRESS_HAPTIC_DELAY = 200 // ms - lands before onLongPress, which uses the 500ms default

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

  const hapticTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const clearHapticTimeout = useEvent(() => {
    if (hapticTimeout.current !== undefined) {
      clearTimeout(hapticTimeout.current)
      hapticTimeout.current = undefined
    }
  })

  useEffect(() => clearHapticTimeout, [clearHapticTimeout])

  const handlePressIn = useEvent(() => {
    didLongPress.current = false
    hasTriggeredLongPressHaptic.current = false
    cancelAnimation(scale)
    scale.value = withSpring(ACTIVE_SCALE, springConfig)
    // Confirms the hold mid-way, before onLongPress opens the menu.
    hapticTimeout.current = setTimeout(() => {
      hapticTimeout.current = undefined
      hasTriggeredLongPressHaptic.current = true
      void hapticFeedback.success()
    }, LONG_PRESS_HAPTIC_DELAY)
  })

  const handlePressOut = useEvent(() => {
    clearHapticTimeout()
    scale.value = withSpring(1, springConfig)
  })

  const handleLongPress = useEvent(() => {
    didLongPress.current = true
    onLongPress()
  })

  return (
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
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        onPress={onPress}
      >
        <CoinConvert size={iconSizes.icon28} color={colors.white.val} />
      </AnimatedTouchableArea>
    </Trace>
  )
}
