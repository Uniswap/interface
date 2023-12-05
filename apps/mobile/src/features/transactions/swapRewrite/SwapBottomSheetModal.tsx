import {
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetView,
  KEYBOARD_STATE,
  useBottomSheetInternal,
} from '@gorhom/bottom-sheet'
import React, { PropsWithChildren, ReactNode, useCallback, useMemo, useRef } from 'react'
import { LayoutChangeEvent, StyleProp, TouchableWithoutFeedback, ViewStyle } from 'react-native'
import {
  Extrapolate,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated'
import { useAppSelector } from 'src/app/hooks'
import { BottomSheetModal, BottomSheetModalRef } from 'src/components/modals/BottomSheetModal'
import { HandleBar } from 'src/components/modals/HandleBar'
import { selectModalState } from 'src/features/modals/selectModalState'
import { ModalName } from 'src/features/telemetry/constants'
import { SwapBottomSheetModalContextProvider } from 'src/features/transactions/swapRewrite/contexts/SwapBottomSheetModalContext'
import {
  SwapFormContextProvider,
  SwapFormState,
} from 'src/features/transactions/swapRewrite/contexts/SwapFormContext'
import { SwapScreenContextProvider } from 'src/features/transactions/swapRewrite/contexts/SwapScreenContext'
import { SwapTxContextProvider } from 'src/features/transactions/swapRewrite/contexts/SwapTxContext'
import { useOnCloseSwapModal } from 'src/features/transactions/swapRewrite/hooks/useOnCloseSwapModal'
import {
  AnimatedFlex,
  Flex,
  LinearGradient,
  useDeviceDimensions,
  useDeviceInsets,
  useSporeColors,
} from 'ui/src'
import { borderRadii, opacify } from 'ui/src/theme'
import {
  CurrencyField,
  TransactionState,
} from 'wallet/src/features/transactions/transactionState/types'

const HANLDEBAR_HEIGHT = 32

export function SwapBottomSheetModal({
  children,
  fullscreen,
  footerComponent,
}: PropsWithChildren<{
  fullscreen: boolean
  footerComponent?: React.FC<BottomSheetFooterProps> | undefined
}>): JSX.Element {
  const colors = useSporeColors()
  const insets = useDeviceInsets()
  const dimensions = useDeviceDimensions()

  const bottomSheetModalRef = useRef<BottomSheetModalRef>(null)

  const onCloseSwapModal = useOnCloseSwapModal()

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
      containerComponent={SwapBottomSheetModalOuterContainer}
      footerComponent={footerComponent}
      fullScreen={fullscreen}
      hideHandlebar={fullscreen}
      name={ModalName.Swap}
      onClose={onCloseSwapModal}>
      <SwapBottomSheetModalContextProvider
        bottomSheetViewStyles={bottomSheetViewStyles}
        handleContentLayout={handleContentLayout}>
        {children}
      </SwapBottomSheetModalContextProvider>
    </BottomSheetModal>
  )
}

export function SwapBottomSheetModalInnerContainer({
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

export function SwapBottomSheetModalFooterContainer({ children }: PropsWithChildren): JSX.Element {
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

function SwapBottomSheetModalOuterContainer({ children }: { children?: ReactNode }): JSX.Element {
  const onCloseSwapModal = useOnCloseSwapModal()
  const { initialState } = useAppSelector(selectModalState(ModalName.Swap))

  const prefilledState = useMemo(
    (): SwapFormState | undefined =>
      initialState
        ? {
            customSlippageTolerance: initialState.customSlippageTolerance,
            exactAmountFiat: initialState.exactAmountFiat,
            exactAmountToken: initialState.exactAmountToken,
            exactCurrencyField: initialState.exactCurrencyField,
            focusOnCurrencyField: getFocusOnCurrencyField(initialState),
            input: initialState.input ?? undefined,
            output: initialState.output ?? undefined,
            selectingCurrencyField: initialState.selectingCurrencyField,
            txId: initialState.txId,
            isFiatMode: false,
            isSubmitting: false,
          }
        : undefined,
    [initialState]
  )

  return (
    <SwapScreenContextProvider>
      <SwapFormContextProvider prefilledState={prefilledState} onClose={onCloseSwapModal}>
        <SwapTxContextProvider>{children}</SwapTxContextProvider>
      </SwapFormContextProvider>
    </SwapScreenContextProvider>
  )
}

function getFocusOnCurrencyField({
  focusOnCurrencyField,
  input,
  output,
  exactCurrencyField,
}: TransactionState): CurrencyField | undefined {
  if (focusOnCurrencyField) {
    return focusOnCurrencyField
  }

  if (input && exactCurrencyField === CurrencyField.INPUT) {
    return CurrencyField.INPUT
  }

  if (output && exactCurrencyField === CurrencyField.OUTPUT) {
    return CurrencyField.OUTPUT
  }

  return undefined
}
