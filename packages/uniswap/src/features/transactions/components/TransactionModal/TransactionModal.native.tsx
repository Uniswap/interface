import { BottomSheetFooter, BottomSheetView, KEYBOARD_STATE, useBottomSheetInternal } from '@gorhom/bottom-sheet'
import { useMemo, useState } from 'react'
import { TouchableWithoutFeedback, type StyleProp, type ViewStyle } from 'react-native'
import { Extrapolation, interpolate, useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated'
import { Flex, LinearGradient, useSporeColors, type ColorTokens, type LinearGradientProps } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { borderRadii, opacify } from 'ui/src/theme'
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
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'

const HANDLEBAR_HEIGHT = 32

// Note: we explicitly set this to 'transparent', otherwise we get a really annoying
// line as a visual artifact on mobile. For example, if a white background is rendered
// on a white background, a grey line sometimes appears as the bottom sheet resizes.
const backgroundColorValue = 'transparent'

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
}: TransactionModalProps): JSX.Element {
  const [screen, setScreen] = useState<TransactionScreen>(TransactionScreen.Form)
  const fullscreen = screen === TransactionScreen.Form

  const colors = useSporeColors()
  const insets = useAppInsets()
  const dimensions = useDeviceDimensions()

  const handleBarHeight = fullscreen ? 0 : HANDLEBAR_HEIGHT

  const fullContentHeight = dimensions.fullHeight - handleBarHeight

  const animatedPosition = useSharedValue(0)

  const animatedBorderRadius = useAnimatedStyle(() => {
    const interpolatedRadius = interpolate(
      animatedPosition.value,
      [0, insets.top],
      [0, borderRadii.rounded24],
      Extrapolation.CLAMP,
    )
    return { borderTopLeftRadius: interpolatedRadius, borderTopRightRadius: interpolatedRadius }
  }, [animatedPosition, insets.top])

  const bottomSheetViewStyles: StyleProp<ViewStyle> = useMemo(
    () => [
      {
        backgroundColor: backgroundColorValue,
        overflow: 'hidden',
        height: fullscreen ? fullContentHeight : undefined,
      },
      animatedBorderRadius,
    ],
    [animatedBorderRadius, fullContentHeight, fullscreen],
  )

  return (
    <Modal
      enableDynamicSizing
      hideKeyboardOnDismiss
      overrideInnerContainer
      renderBehindTopInset
      animatedPosition={animatedPosition}
      backgroundColor={colors.surface1.val}
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
        {children}
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

  const { animatedFooterHeight } = useBottomSheetInternal()

  const animatedPaddingBottom = useAnimatedStyle(() => {
    return { paddingBottom: animatedFooterHeight.value }
  })

  return (
    <BottomSheetView style={bottomSheetViewStyles}>
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
    </BottomSheetView>
  )
}

const linearGradientEnd: LinearGradientProps['end'] = [0, 0.15]
const linearGradientStart: LinearGradientProps['start'] = [0, 0]

export function TransactionModalFooterContainer({ children }: TransactionModalFooterContainerProps): JSX.Element {
  const insets = useAppInsets()
  const colors = useSporeColors()

  // Most of this logic is based on the `BottomSheetFooterContainer` component from `@gorhom/bottom-sheet`.
  const {
    animatedContainerHeight,
    animatedFooterHeight,
    animatedHandleHeight,
    animatedKeyboardHeightInContainer,
    animatedKeyboardState,
    animatedPosition,
  } = useBottomSheetInternal()

  const animatedFooterPosition = useDerivedValue(() => {
    const keyboardHeight = animatedKeyboardHeightInContainer.value
    let footerTranslateY = Math.max(0, animatedContainerHeight.value - animatedPosition.value)

    if (animatedKeyboardState.value === KEYBOARD_STATE.SHOWN) {
      footerTranslateY = footerTranslateY - keyboardHeight
    }

    footerTranslateY = footerTranslateY - animatedFooterHeight.value - animatedHandleHeight.value

    return footerTranslateY
  }, [
    animatedKeyboardHeightInContainer,
    animatedContainerHeight,
    animatedPosition,
    animatedKeyboardState,
    animatedFooterHeight,
    animatedHandleHeight,
  ])

  const linearGradientColor = useMemo((): ColorTokens[] => {
    return [opacify(0, colors.background.val), colors.background.val] as ColorTokens[]
  }, [colors.background.val])

  return (
    <BottomSheetFooter animatedFooterPosition={animatedFooterPosition}>
      <Flex animateEnter="fadeIn" mx="$spacing16" pb={insets.bottom} position="relative" pt="$spacing24">
        {children}

        {/*
            This gradient adds a background behind the footer so that the content is hidden behind it
            when the user is moving the sheet, while the footer stays in place.
          */}
        <Flex bottom={0} left={0} position="absolute" right={0} top={0} zIndex={-1}>
          <LinearGradient
            colors={linearGradientColor}
            end={linearGradientEnd}
            height="100%"
            start={linearGradientStart}
            width="100%"
          />
        </Flex>
      </Flex>
    </BottomSheetFooter>
  )
}
