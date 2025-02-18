import { BottomSheetFooter, BottomSheetView, KEYBOARD_STATE, useBottomSheetInternal } from '@gorhom/bottom-sheet'
import { useMemo, useState } from 'react'
import { StyleProp, TouchableWithoutFeedback, ViewStyle } from 'react-native'
import {
  Extrapolate,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated'
import { Flex, LinearGradient, useSporeColors } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { borderRadii, opacify } from 'ui/src/theme'
import { HandleBar } from 'uniswap/src/components/modals/HandleBar'
import { Modal } from 'uniswap/src/components/modals/Modal'
import {
  TransactionModalContextProvider,
  TransactionScreen,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import {
  TransactionModalFooterContainerProps,
  TransactionModalInnerContainerProps,
  TransactionModalProps,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModalProps'
import { TransactionModalUpdateLogger } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalUpdateLogger'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'

const HANLDEBAR_HEIGHT = 32

export function TransactionModal({
  children,
  modalName,
  onClose,
  ...transactionContextProps
}: TransactionModalProps): JSX.Element {
  const [screen, setScreen] = useState<TransactionScreen>(TransactionScreen.Form)
  const fullscreen = screen === TransactionScreen.Form

  const colors = useSporeColors()
  const insets = useAppInsets()
  const dimensions = useDeviceDimensions()

  // Note: we explicitly set this to 'transparent', otherwise we get a really annoying
  // line as a visual artifact on mobile. For example, if a white background is rendered
  // on a white background, a grey line sometimes appears as the bottom sheet resizes.
  const backgroundColorValue = 'transparent'

  const handleBarHeight = fullscreen ? 0 : HANLDEBAR_HEIGHT

  const fullContentHeight = dimensions.fullHeight - handleBarHeight

  const animatedPosition = useSharedValue(0)

  const animatedBorderRadius = useAnimatedStyle(() => {
    const interpolatedRadius = interpolate(
      animatedPosition.value,
      [0, insets.top],
      [0, borderRadii.rounded24],
      Extrapolate.CLAMP,
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
    [animatedBorderRadius, backgroundColorValue, fullContentHeight, fullscreen],
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
        onClose={onClose}
        {...transactionContextProps}
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
    <BottomSheetView style={[bottomSheetViewStyles]}>
      {/* Do not remove `accessible`, this allows maestro to view components within this */}
      <TouchableWithoutFeedback accessible={false}>
        <Flex mt={fullscreen ? insets.top : '$spacing8'}>
          {fullscreen && <HandleBar backgroundColor="none" />}

          <AnimatedFlex grow row height={fullscreen ? '100%' : undefined} style={animatedPaddingBottom}>
            <Flex px="$spacing16" width="100%">
              {children}
            </Flex>
          </AnimatedFlex>
        </Flex>
      </TouchableWithoutFeedback>
    </BottomSheetView>
  )
}

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

  return (
    <BottomSheetFooter animatedFooterPosition={animatedFooterPosition}>
      <AnimatedFlex entering={FadeIn} mx="$spacing16" pb={insets.bottom} position="relative" pt="$spacing24">
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
