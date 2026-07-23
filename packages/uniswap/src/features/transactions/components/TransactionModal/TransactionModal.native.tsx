import { BottomSheetFooter, BottomSheetView, KEYBOARD_STATUS, useBottomSheetInternal } from '@gorhom/bottom-sheet'
import { isAndroid } from '@universe/environment'
import { useMemo, useState } from 'react'
import { type StyleProp, TouchableWithoutFeedback, type ViewStyle } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated'
import { type ColorTokens, Flex, LinearGradient, type LinearGradientProps, useSporeColors } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { DEFAULT_BOTTOM_INSET } from 'ui/src/hooks/constants'
import { borderRadii, opacify, spacing } from 'ui/src/theme'
import { HandleBar } from 'uniswap/src/components/modals/HandleBar'
import { Modal } from 'uniswap/src/components/modals/Modal'
import {
  TransactionModalContextProvider,
  TransactionScreen,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import type {
  TransactionModalFooterContainerProps,
  TransactionModalInnerContainerProps,
  TransactionModalProps,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalProps'
import { TransactionModalUpdateLogger } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalUpdateLogger'
import { SwapFlowTimerContext } from 'uniswap/src/features/transactions/swap/utils/SwapFlowTimerContext'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'

export function TransactionModal({
  children,
  modalName,
  onClose,
  authTrigger,
  onCurrencyChange,
  openWalletRestoreModal,
  renderBiometricsIcon,
  swapRedirectCallback,
  walletNeedsRestore,
  swapFlowTimer,
}: TransactionModalProps): JSX.Element {
  const [screen, setScreen] = useState<TransactionScreen>(TransactionScreen.Form)
  const fullscreen = screen === TransactionScreen.Form

  const colors = useSporeColors()

  const animatedPosition = useSharedValue(0)

  // Reanimated 4 strict mode rejects animated styles passed to non-animated
  // components, and `BottomSheetView` (gorhom 5) renders as a plain <View>.
  // Keep the static styles on `bottomSheetViewStyles`; the animated border
  // radius is computed and applied via an <Animated.View> wrapper inside
  // `TransactionModalInnerContainer`, which reads `animatedPosition` from
  // the gorhom internal context.
  const bottomSheetViewStyles: StyleProp<ViewStyle> = useMemo(
    () => ({
      // Note: we explicitly set this to 'transparent', otherwise we get a really annoying
      // line as a visual artifact on mobile. For example, if a white background is rendered
      // on a white background, a grey line sometimes appears as the bottom sheet resizes.
      backgroundColor: 'transparent',
      height: fullscreen ? '100%' : undefined,
    }),
    [fullscreen],
  )

  return (
    <Modal
      hideKeyboardOnDismiss
      overrideInnerContainer
      renderBehindTopInset
      animatedPosition={animatedPosition}
      backgroundColor={colors.surface1.val}
      enableDynamicSizing={!fullscreen}
      fullScreen={fullscreen}
      hideHandlebar={fullscreen}
      name={modalName}
      onClose={onClose}
    >
      <TransactionModalContextProvider
        bottomSheetViewStyles={bottomSheetViewStyles}
        screen={screen}
        setScreen={setScreen}
        authTrigger={authTrigger}
        openWalletRestoreModal={openWalletRestoreModal}
        renderBiometricsIcon={renderBiometricsIcon}
        swapRedirectCallback={swapRedirectCallback}
        walletNeedsRestore={walletNeedsRestore}
        onClose={onClose}
        onCurrencyChange={onCurrencyChange}
      >
        {swapFlowTimer ? (
          <SwapFlowTimerContext.Provider value={swapFlowTimer}>{children}</SwapFlowTimerContext.Provider>
        ) : (
          children
        )}
        <TransactionModalUpdateLogger modalName={modalName} />
      </TransactionModalContextProvider>
    </Modal>
  )
}

export function TransactionModalInnerContainer({
  bottomSheetViewStyles,
  fullscreen,
  children,
}: TransactionModalInnerContainerProps): JSX.Element {
  const insets = useAppInsets()

  const { animatedLayoutState, animatedPosition } = useBottomSheetInternal()

  const animatedPaddingBottom = useAnimatedStyle(() => {
    return { paddingBottom: animatedLayoutState.value.footerHeight }
  })

  // Animated border radius for the sheet's top corners as it pulls down
  // toward the safe-area top. Computed here (not in the outer
  // TransactionModal) so it can be applied via an Animated.View wrapper —
  // BottomSheetView itself is a plain <View> and Reanimated 4 strict mode
  // rejects animated styles on non-animated components.
  const animatedBorderRadius = useAnimatedStyle(() => {
    const interpolatedRadius = interpolate(
      animatedPosition.value,
      [0, insets.top],
      [0, borderRadii.rounded24],
      Extrapolation.CLAMP,
    )
    return {
      borderTopLeftRadius: interpolatedRadius,
      borderTopRightRadius: interpolatedRadius,
      overflow: 'hidden',
    }
  }, [animatedPosition, insets.top])

  return (
    <BottomSheetView style={bottomSheetViewStyles}>
      <Animated.View style={[styles.fill, animatedBorderRadius]}>
        {/* Do not remove `accessible`, this allows maestro to view components within this */}
        <TouchableWithoutFeedback accessible={false}>
          <Flex mt={fullscreen ? insets.top : '$spacing8'}>
            {fullscreen && <HandleBar backgroundColor="none" />}

            <AnimatedFlex
              grow
              row
              animation="fast"
              style={animatedPaddingBottom}
              height={fullscreen ? '100%' : undefined}
            >
              <Flex px="$spacing16" width="100%">
                {children}
              </Flex>
            </AnimatedFlex>
          </Flex>
        </TouchableWithoutFeedback>
      </Animated.View>
    </BottomSheetView>
  )
}

const styles = { fill: { flex: 1 } } as const

const linearGradientEnd: LinearGradientProps['end'] = [0, 0.15]
const linearGradientStart: LinearGradientProps['start'] = [0, 0]

export function TransactionModalFooterContainer({ children }: TransactionModalFooterContainerProps): JSX.Element {
  const insets = useAppInsets()
  const colors = useSporeColors()

  // Most of this logic is based on the `BottomSheetFooterContainer` component from `@gorhom/bottom-sheet`.
  const { animatedLayoutState, animatedKeyboardState, animatedPosition } = useBottomSheetInternal()

  const animatedFooterPosition = useDerivedValue(() => {
    const keyboardState = animatedKeyboardState.value
    const { containerHeight, footerHeight, handleHeight } = animatedLayoutState.value
    let footerTranslateY = Math.max(0, containerHeight - animatedPosition.value)

    if (keyboardState.status === KEYBOARD_STATUS.SHOWN) {
      footerTranslateY = footerTranslateY - keyboardState.heightWithinContainer
    }

    footerTranslateY = footerTranslateY - footerHeight - handleHeight

    return footerTranslateY
  }, [animatedLayoutState, animatedPosition, animatedKeyboardState])

  const linearGradientColor = useMemo((): ColorTokens[] => {
    return [opacify(0, colors.background.val), colors.background.val] as ColorTokens[]
  }, [colors.background.val])

  // On Android, we increase the bottom inset because the inset is too small compared to iOS.
  // We check that the inset is not the default one in order to ignore this when the device is not using gesture navigation.
  const bottomInset =
    isAndroid && insets.bottom !== DEFAULT_BOTTOM_INSET ? insets.bottom + spacing.spacing8 : insets.bottom

  return (
    <BottomSheetFooter animatedFooterPosition={animatedFooterPosition}>
      <Flex animateEnter="fadeIn" mx="$spacing16" pb={bottomInset} position="relative" pt="$spacing24">
        {children}

        {/*
            This gradient adds a background behind the footer so that the content is hidden behind it
            when the user is moving the sheet, while the footer stays in place.
          */}
        <Flex bottom={0} left={0} position="absolute" right={0} top={0} zIndex={-1}>
          <LinearGradient
            colors={linearGradientColor}
            start={linearGradientStart}
            end={linearGradientEnd}
            style={{ flex: 1, borderTopLeftRadius: borderRadii.rounded24, borderTopRightRadius: borderRadii.rounded24 }}
          />
        </Flex>
      </Flex>
    </BottomSheetFooter>
  )
}
