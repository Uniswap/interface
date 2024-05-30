import {
  BottomSheetFooter,
  BottomSheetView,
  KEYBOARD_STATE,
  useBottomSheetInternal,
} from '@gorhom/bottom-sheet'
import { useMemo } from 'react'
import { StyleProp, TouchableWithoutFeedback, ViewStyle } from 'react-native'
import {
  Extrapolate,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated'
import {
  AnimatedFlex,
  Flex,
  LinearGradient,
  useDeviceDimensions,
  useDeviceInsets,
  useSporeColors,
} from 'ui/src'
import { borderRadii, opacify } from 'ui/src/theme'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { HandleBar } from 'wallet/src/components/modals/HandleBar'
import { TransactionModalContextProvider } from 'wallet/src/features/transactions/contexts/TransactionModalContext'
import {
  TransactionModalFooterContainerProps,
  TransactionModalInnerContainerProps,
  TransactionModalProps,
} from 'wallet/src/features/transactions/swap/TransactionModalProps'

const HANLDEBAR_HEIGHT = 32

export function TransactionModal({
  children,
  fullscreen,
  modalName,
  onClose,
  ...transactionContextProps
}: TransactionModalProps): JSX.Element {
  const colors = useSporeColors()
  const insets = useDeviceInsets()
  const dimensions = useDeviceDimensions()

  const backgroundColorValue = colors.surface1.get()

  const handleBarHeight = fullscreen ? 0 : HANLDEBAR_HEIGHT

  const fullContentHeight = dimensions.fullHeight - handleBarHeight

  const animatedPosition = useSharedValue(0)

  const animatedBorderRadius = useAnimatedStyle(() => {
    const interpolatedRadius = interpolate(
      animatedPosition.value,
      [0, insets.top],
      [0, borderRadii.rounded24],
      Extrapolate.CLAMP
    )
    return { borderTopLeftRadius: interpolatedRadius, borderTopRightRadius: interpolatedRadius }
  })

  const bottomSheetViewStyles: StyleProp<ViewStyle> = useMemo(
    () => [
      {
        backgroundColor: backgroundColorValue,
        overflow: 'hidden',
        height: fullscreen ? fullContentHeight : undefined,
      },
      animatedBorderRadius,
    ],
    [animatedBorderRadius, backgroundColorValue, fullContentHeight, fullscreen]
  )

  return (
    <BottomSheetModal
      enableDynamicSizing
      hideKeyboardOnDismiss
      overrideInnerContainer
      renderBehindTopInset
      animatedPosition={animatedPosition}
      backgroundColor={colors.surface1.get()}
      fullScreen={fullscreen}
      hideHandlebar={fullscreen}
      name={modalName}
      onClose={onClose}>
      <TransactionModalContextProvider
        bottomSheetViewStyles={bottomSheetViewStyles}
        onClose={onClose}
        {...transactionContextProps}>
        {children}
      </TransactionModalContextProvider>
    </BottomSheetModal>
  )
}

export function TransactionModalInnerContainer({
  bottomSheetViewStyles,
  fullscreen,
  children,
}: TransactionModalInnerContainerProps): JSX.Element {
  const insets = useDeviceInsets()

  const { animatedFooterHeight } = useBottomSheetInternal()

  const animatedPaddingBottom = useAnimatedStyle(() => {
    return { paddingBottom: animatedFooterHeight.value }
  })

  return (
    <BottomSheetView style={[bottomSheetViewStyles]}>
      <TouchableWithoutFeedback>
        <Flex mt={fullscreen ? insets.top : '$spacing8'}>
          {fullscreen && <HandleBar backgroundColor="none" />}

          <AnimatedFlex
            grow
            row
            height={fullscreen ? '100%' : undefined}
            style={animatedPaddingBottom}>
            <Flex px="$spacing16" width="100%">
              {children}
            </Flex>
          </AnimatedFlex>
        </Flex>
      </TouchableWithoutFeedback>
    </BottomSheetView>
  )
}

export function TransactionModalFooterContainer({
  children,
}: TransactionModalFooterContainerProps): JSX.Element {
  const insets = useDeviceInsets()
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

  return (
    <BottomSheetFooter animatedFooterPosition={animatedFooterPosition}>
      <AnimatedFlex
        entering={FadeIn}
        mx="$spacing16"
        pb={insets.bottom}
        position="relative"
        pt="$spacing24">
        {children}

        {/*
            This gradient adds a background behind the footer so that the content is hidden behind it
            when the user is moving the sheet, while the footer stays in place.
          */}
        <Flex bottom={0} left={0} position="absolute" right={0} top={0} zIndex={-1}>
          <LinearGradient
            colors={[opacify(0, colors.background.val), colors.background.val]}
            end={[0, 0.15]}
            height="100%"
            start={[0, 0]}
            width="100%"
          />
        </Flex>
      </AnimatedFlex>
    </BottomSheetFooter>
  )
}
