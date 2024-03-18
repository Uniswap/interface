import {
  BottomSheetModal as BaseModal,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetHandleProps,
  BottomSheetView,
  // eslint-disable-next-line no-restricted-imports
  BottomSheetTextInput as GorhomBottomSheetTextInput,
} from '@gorhom/bottom-sheet'
import { BlurView } from 'expo-blur'
import React, { ComponentProps, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BackHandler, Keyboard, StyleProp, StyleSheet, ViewStyle } from 'react-native'
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import {
  Flex,
  useDeviceDimensions,
  useDeviceInsets,
  useIsDarkMode,
  useMedia,
  useSporeColors,
} from 'ui/src'
import { borderRadii, spacing } from 'ui/src/theme'
import { isAndroid, isIOS } from 'uniswap/src/utils/platform'
import { Trace } from 'utilities/src/telemetry/trace/Trace'
import { BottomSheetModalProps } from 'wallet/src/components/modals/BottomSheetModalProps'
import { useKeyboardLayout } from 'wallet/src/utils/useKeyboardLayout'
import { BottomSheetContextProvider } from './BottomSheetContext'
import { HandleBar } from './HandleBar'

/**
 * (android only)
 * Adds a back handler to the modal that dismisses it when the back button is pressed.
 *
 * @param modalRef - ref to the modal
 * @param enabled - whether to enable the back handler
 */
function useModalBackHandler(modalRef: React.RefObject<BaseModal>, enabled: boolean): void {
  useEffect(() => {
    if (enabled) {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        modalRef.current?.close()
        return true
      })

      return subscription.remove
    }
  }, [modalRef, enabled])
}

const BACKDROP_APPEARS_ON_INDEX = 0
const DISAPPEARS_ON_INDEX = -1
const DRAG_ACTIVATION_OFFSET = 40

const Backdrop = (props: BottomSheetBackdropProps): JSX.Element => {
  return (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={BACKDROP_APPEARS_ON_INDEX}
      disappearsOnIndex={DISAPPEARS_ON_INDEX}
      opacity={0.4}
    />
  )
}

export function BottomSheetModal({
  children,
  name,
  onClose,
  snapPoints: providedSnapPoints,
  stackBehavior = 'push',
  animatedPosition: providedAnimatedPosition,
  containerComponent,
  footerComponent,
  fullScreen,
  hideHandlebar,
  backgroundColor,
  // defaults to true if snapPoints/fullScreen are not provided and false otherwise
  enableDynamicSizing,
  blurredBackground = false,
  dismissOnBackPress = true,
  isDismissible = true,
  overrideInnerContainer = false,
  renderBehindTopInset = false,
  renderBehindBottomInset = false,
  hideKeyboardOnDismiss = false,
  hideKeyboardOnSwipeDown = false,
  // keyboardBehavior="extend" does not work and it's hard to figure why,
  // probably it requires usage of <BottomSheetTextInput>
  extendOnKeyboardVisible = false,
  hideScrim = false,
}: BottomSheetModalProps): JSX.Element {
  const dimensions = useDeviceDimensions()
  const insets = useDeviceInsets()
  const media = useMedia()
  const keyboard = useKeyboardLayout()
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()

  const modalRef = useRef<BaseModal>(null)
  const internalAnimatedPosition = useSharedValue(0)
  const [isSheetReady, setIsSheetReady] = useState(false)

  const snapPoints = useMemo(
    () => providedSnapPoints ?? (fullScreen ? ['100%'] : undefined),
    [providedSnapPoints, fullScreen]
  )

  useModalBackHandler(modalRef, isDismissible && dismissOnBackPress)

  useEffect(() => {
    modalRef.current?.present()
    // Close modal when it is unmounted
    return modalRef.current?.close
  }, [modalRef])

  useEffect(() => {
    if (extendOnKeyboardVisible && keyboard.isVisible) {
      modalRef.current?.expand()
    }
  }, [extendOnKeyboardVisible, keyboard.isVisible])

  const animatedPosition = providedAnimatedPosition ?? internalAnimatedPosition

  const backgroundColorValue = blurredBackground
    ? colors.transparent.val
    : backgroundColor ?? colors.surface1.get()

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={BACKDROP_APPEARS_ON_INDEX}
        disappearsOnIndex={DISAPPEARS_ON_INDEX}
        opacity={hideScrim ? 0 : blurredBackground ? 0.2 : 0.4}
        pressBehavior={isDismissible ? 'close' : 'none'}
      />
    ),
    [blurredBackground, hideScrim, isDismissible]
  )

  const renderHandleBar = useCallback(
    (props: BottomSheetHandleProps) => {
      // This adds an extra gap of unwanted space
      if (renderBehindTopInset && hideHandlebar) {
        return null
      }
      return (
        <HandleBar
          {...props}
          backgroundColor={backgroundColorValue}
          containerFlexStyles={{
            paddingBottom: spacing.spacing12,
            paddingTop: spacing.spacing16,
          }}
          hidden={hideHandlebar}
        />
      )
    },
    [backgroundColorValue, hideHandlebar, renderBehindTopInset]
  )

  const animatedBorderRadius = useAnimatedStyle(() => {
    const interpolatedRadius = interpolate(
      animatedPosition.value,
      [0, insets.top],
      [0, borderRadius ?? borderRadii.rounded24],
      Extrapolate.CLAMP
    )
    return { borderTopLeftRadius: interpolatedRadius, borderTopRightRadius: interpolatedRadius }
  })

  const renderBlurredBg = useCallback(
    () => (
      <Animated.View style={[blurViewStyle.base, animatedBorderRadius]}>
        {isIOS ? (
          <BlurView
            intensity={90}
            style={blurViewStyle.base}
            tint={isDarkMode ? 'dark' : 'light'}
          />
        ) : (
          <Flex fill backgroundColor="$surface2" />
        )}
      </Animated.View>
    ),
    [isDarkMode, animatedBorderRadius]
  )

  // onAnimate is called when the sheet is about to animate to a new position.
  // `About to` is crucial here, because we want to trigger these actions as soon as possible.
  // See here: https://gorhom.github.io/react-native-bottom-sheet/props#onanimate
  const onAnimate = useCallback(
    // We want to start hiding the keyboard during the process of hiding the sheet.
    (fromIndex: number, toIndex: number): void => {
      if (
        (hideKeyboardOnDismiss && toIndex === DISAPPEARS_ON_INDEX) ||
        (hideKeyboardOnSwipeDown && toIndex < fromIndex)
      ) {
        Keyboard.dismiss()
      }

      // When a sheet has too much content it can lag and take a while to begin opening, so we want to delay rendering some of the content until the sheet is ready.
      // We consider the sheet to be "ready" as soon as it starts animating from the bottom to the top.
      // We add a short delay given that this callback is called when the sheet is "about to" animate.
      if (!isSheetReady && fromIndex === -1 && toIndex === 0) {
        setTimeout(() => setIsSheetReady(true), 50)
      }
    },
    [hideKeyboardOnDismiss, hideKeyboardOnSwipeDown, isSheetReady]
  )

  // on screens < xs (iPhone SE), assume no rounded corners on screen and remove rounded corners from fullscreen modal
  const borderRadius = media.short ? borderRadii.none : borderRadii.rounded24

  const hiddenHandlebarStyle = {
    borderTopLeftRadius: borderRadius,
    borderTopRightRadius: borderRadius,
  }

  const background = blurredBackground ? { backgroundComponent: renderBlurredBg } : undefined
  const backdrop = { backdropComponent: renderBackdrop }

  const backgroundStyle = {
    backgroundColor: backgroundColorValue,
  }

  const bottomSheetViewStyles: StyleProp<ViewStyle> = [{ backgroundColor: backgroundColorValue }]

  const handleBarHeight = hideHandlebar
    ? 0
    : spacing.spacing12 + spacing.spacing16 + spacing.spacing4
  let fullContentHeight = dimensions.fullHeight - insets.top - handleBarHeight

  if (renderBehindTopInset) {
    bottomSheetViewStyles.push(bottomSheetStyle.behindInset)
    if (hideHandlebar) {
      bottomSheetViewStyles.push(animatedBorderRadius)
    }
    fullContentHeight += insets.top
  } else if (hideHandlebar) {
    bottomSheetViewStyles.push(hiddenHandlebarStyle)
  }
  if (!renderBehindBottomInset) {
    bottomSheetViewStyles.push({ paddingBottom: insets.bottom })
  }
  // Add the calculated height only if the sheet is full screen
  // (otherwise, rely on the dynamic sizing of the sheet)
  if (fullScreen) {
    bottomSheetViewStyles.push({ height: fullContentHeight })
  }

  return (
    <BaseModal
      {...background}
      {...backdrop}
      ref={modalRef}
      // This is required for android to make scrollable containers work
      // and allow closing the modal by dragging the content
      // (adding this property on iOS breaks closing the modal by dragging the content)
      activeOffsetY={isAndroid ? [-DRAG_ACTIVATION_OFFSET, DRAG_ACTIVATION_OFFSET] : undefined}
      animatedPosition={animatedPosition}
      backgroundStyle={backgroundStyle}
      containerComponent={containerComponent}
      enableContentPanningGesture={isDismissible}
      enableDynamicSizing={!snapPoints || enableDynamicSizing}
      enableHandlePanningGesture={isDismissible}
      footerComponent={footerComponent}
      handleComponent={renderHandleBar}
      snapPoints={snapPoints}
      stackBehavior={stackBehavior}
      topInset={renderBehindTopInset ? 0 : insets.top}
      onAnimate={onAnimate}
      onDismiss={onClose}>
      <Trace logImpression modal={name}>
        <BottomSheetContextProvider isSheetReady={isSheetReady}>
          {overrideInnerContainer ? (
            children
          ) : (
            <BottomSheetView style={bottomSheetViewStyles}>{children}</BottomSheetView>
          )}
        </BottomSheetContextProvider>
      </Trace>
    </BaseModal>
  )
}

export function BottomSheetDetachedModal({
  children,
  name,
  onClose,
  snapPoints,
  stackBehavior = 'push',
  isDismissible = true,
  dismissOnBackPress = true,
  fullScreen,
  hideHandlebar,
  backgroundColor,
}: BottomSheetModalProps): JSX.Element {
  const insets = useDeviceInsets()
  const dimensions = useDeviceDimensions()
  const modalRef = useRef<BaseModal>(null)
  const colors = useSporeColors()

  useModalBackHandler(modalRef, isDismissible && dismissOnBackPress)

  useEffect(() => {
    modalRef.current?.present()
    // Close modal when it is unmounted
    return modalRef.current?.close
  }, [modalRef])

  const renderHandleBar = useCallback(
    (props: BottomSheetHandleProps) => {
      return <HandleBar {...props} backgroundColor={backgroundColor} hidden={hideHandlebar} />
    },
    [backgroundColor, hideHandlebar]
  )

  const backgroundStyle = hideHandlebar
    ? bottomSheetStyle.modalTransparent
    : {
        backgroundColor: backgroundColor ?? colors.surface1.get(),
      }
  const handleBarHeight = hideHandlebar ? 0 : spacing.spacing4
  const fullContentHeight = dimensions.fullHeight - insets.top - handleBarHeight

  return (
    <BaseModal
      ref={modalRef}
      // This is required for android to make scrollable containers work
      // and allow closing the modal by dragging the content
      // (adding this property on iOS breaks closing the modal by dragging the content)
      activeOffsetY={isAndroid ? [-DRAG_ACTIVATION_OFFSET, DRAG_ACTIVATION_OFFSET] : undefined}
      backdropComponent={Backdrop}
      backgroundStyle={backgroundStyle}
      bottomInset={insets.bottom}
      detached={true}
      enableContentPanningGesture={isDismissible}
      enableDynamicSizing={!snapPoints}
      handleComponent={renderHandleBar}
      snapPoints={snapPoints}
      stackBehavior={stackBehavior}
      style={bottomSheetStyle.detached}
      topInset={insets.top}
      onDismiss={onClose}>
      <Trace logImpression modal={name}>
        <BottomSheetView style={fullScreen ? { height: fullContentHeight } : undefined}>
          {children}
        </BottomSheetView>
      </Trace>
    </BaseModal>
  )
}

const bottomSheetStyle = StyleSheet.create({
  behindInset: {
    overflow: 'hidden',
  },
  detached: {
    marginHorizontal: spacing.spacing12,
  },
  modalTransparent: {
    backgroundColor: 'transparent',
    borderRadius: 0,
  },
})

const blurViewStyle = StyleSheet.create({
  base: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
})

export function BottomSheetTextInput(
  props: ComponentProps<typeof GorhomBottomSheetTextInput>
): JSX.Element {
  return <GorhomBottomSheetTextInput {...props} />
}
