import {
  BottomSheetFooter,
  BottomSheetView,
  KEYBOARD_STATE,
  useBottomSheetInternal,
} from '@gorhom/bottom-sheet'
import React, { PropsWithChildren, useCallback, useMemo, useRef } from 'react'
import { LayoutChangeEvent, StyleProp, TouchableWithoutFeedback, ViewStyle } from 'react-native'
import {
  Extrapolate,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated'
import { BottomSheetModal, BottomSheetModalRef } from 'src/components/modals/BottomSheetModal'
import { HandleBar } from 'src/components/modals/HandleBar'
import { ModalName } from 'src/features/telemetry/constants'
import { TransactionModalContextProvider } from 'src/features/transactions/swapRewrite/contexts/TransactionModalContext'
import {
  AnimatedFlex,
  Flex,
  LinearGradient,
  useDeviceDimensions,
  useDeviceInsets,
  useSporeColors,
} from 'ui/src'
import { borderRadii, opacify } from 'ui/src/theme'

const HANLDEBAR_HEIGHT = 32

export function TransactionModal({
  children,
  fullscreen,
  onClose,
  modalName,
}: PropsWithChildren<{
  fullscreen: boolean
  modalName: ModalName
  onClose: () => void
}>): JSX.Element {
  const colors = useSporeColors()
  const insets = useDeviceInsets()
  const dimensions = useDeviceDimensions()

  const bottomSheetModalRef = useRef<BottomSheetModalRef>(null)

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

  const handleContentLayout = useCallback(
    (event: LayoutChangeEvent): void => bottomSheetModalRef.current?.handleContentLayout(event),
    []
  )

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
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
        handleContentLayout={handleContentLayout}>
        {children}
      </TransactionModalContextProvider>
    </BottomSheetModal>
  )
}

export function TransactionModalInnerContainer({
  bottomSheetViewStyles,
  onLayout,
  fullscreen,
  children,
}: PropsWithChildren<{
  bottomSheetViewStyles: StyleProp<ViewStyle>
  onLayout: (event: LayoutChangeEvent) => void
  fullscreen: boolean
}>): JSX.Element {
  const insets = useDeviceInsets()

  const { animatedFooterHeight } = useBottomSheetInternal()

  const animatedPaddingBottom = useAnimatedStyle(() => {
    return { paddingBottom: animatedFooterHeight.value }
  })

  return (
    <BottomSheetView style={[bottomSheetViewStyles]} onLayout={onLayout}>
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

export function TransactionModalFooterContainer({ children }: PropsWithChildren): JSX.Element {
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
