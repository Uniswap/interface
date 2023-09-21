import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal as BaseModal,
  BottomSheetView,
  useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet'
import { useResponsiveProp } from '@shopify/restyle'
import { BlurView } from 'expo-blur'
import React, {
  ComponentProps,
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { BackHandler, Keyboard, StyleSheet } from 'react-native'
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomSheetContextProvider } from 'src/components/modals/BottomSheetContext'
import { HandleBar } from 'src/components/modals/HandleBar'
import Trace from 'src/components/Trace/Trace'
import { IS_ANDROID, IS_IOS } from 'src/constants/globals'
import { ModalName } from 'src/features/telemetry/constants'
import { useKeyboardLayout } from 'src/utils/useKeyboardLayout'
import { Flex, useSporeColors } from 'ui/src'
import { borderRadii, dimensions, spacing } from 'ui/src/theme'
import { theme as FixedTheme } from 'ui/src/theme/restyle'
import { useIsDarkMode } from 'wallet/src/features/appearance/hooks'

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

type Props = PropsWithChildren<{
  disableSwipe?: boolean
  hideHandlebar?: boolean
  name: ModalName
  onClose?: () => void
  snapPoints?: Array<string | number>
  stackBehavior?: ComponentProps<typeof BaseModal>['stackBehavior']
  fullScreen?: boolean
  backgroundColor?: string
  blurredBackground?: boolean
  dismissOnBackPress?: boolean
  isDismissible?: boolean
  renderBehindInset?: boolean
  hideKeyboardOnDismiss?: boolean
  hideKeyboardOnSwipeDown?: boolean
  // extend the sheet to its maximum snap point when keyboard is visible
  extendOnKeyboardVisible?: boolean
}>

const BACKDROP_APPEARS_ON_INDEX = 0
const DISAPPEARS_ON_INDEX = -1
const DRAG_ACTIVATION_OFFSET = 25

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

const CONTENT_HEIGHT_SNAP_POINTS = ['CONTENT_HEIGHT']
const FULL_HEIGHT = 0.91

export function BottomSheetModal({
  children,
  name,
  onClose,
  snapPoints = CONTENT_HEIGHT_SNAP_POINTS,
  stackBehavior = 'push',
  fullScreen,
  hideHandlebar,
  backgroundColor,
  blurredBackground = false,
  dismissOnBackPress = true,
  isDismissible = true,
  renderBehindInset = false,
  hideKeyboardOnDismiss = false,
  hideKeyboardOnSwipeDown = false,
  // keyboardBehavior="extend" does not work and it's hard to figure why,
  // probably it requires usage of <BottomSheetTextInput>
  extendOnKeyboardVisible = false,
}: Props): JSX.Element {
  const insets = useSafeAreaInsets()
  const modalRef = useRef<BaseModal>(null)
  const keyboard = useKeyboardLayout()

  const [isSheetReady, setIsSheetReady] = useState(false)

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

  const { animatedHandleHeight, animatedSnapPoints, animatedContentHeight, handleContentLayout } =
    useBottomSheetDynamicSnapPoints(snapPoints)
  const animatedPosition = useSharedValue(0)
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()

  const backgroundColorValue = blurredBackground
    ? colors.transparent.val
    : backgroundColor ?? colors.surface1.val

  const renderBackdrop = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={BACKDROP_APPEARS_ON_INDEX}
        disappearsOnIndex={DISAPPEARS_ON_INDEX}
        opacity={blurredBackground ? 0.2 : 0.4}
        pressBehavior={isDismissible ? 'close' : 'none'}
      />
    ),
    [blurredBackground, isDismissible]
  )

  const renderHandleBar = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props: any) => {
      // This adds an extra gap of unwanted space
      if (renderBehindInset && hideHandlebar) {
        return null
      }
      return (
        <HandleBar
          {...props}
          backgroundColor={backgroundColorValue}
          containerFlexStyles={{
            marginBottom: FixedTheme.spacing.spacing12,
            marginTop: FixedTheme.spacing.spacing16,
          }}
          hidden={hideHandlebar}
        />
      )
    },
    [backgroundColorValue, hideHandlebar, renderBehindInset]
  )

  const fullScreenContentHeight = (renderBehindInset ? 1 : FULL_HEIGHT) * dimensions.fullHeight

  const borderRadius = useResponsiveProp({
    // on screens without rounded corners, remove rounded corners when modal is fullscreen
    xs: borderRadii.none,
    sm: borderRadii.rounded24,
  })

  const hiddenHandlebarStyle = {
    borderTopLeftRadius: borderRadius,
    borderTopRightRadius: borderRadius,
  }

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
      <Animated.View style={[BlurViewStyle.base, animatedBorderRadius]}>
        {IS_IOS ? (
          <BlurView
            intensity={90}
            style={BlurViewStyle.base}
            tint={isDarkMode ? 'dark' : 'light'}
          />
        ) : (
          <Flex fill bg="$surface2" />
        )}
      </Animated.View>
    ),
    [isDarkMode, animatedBorderRadius]
  )

  const background = blurredBackground ? { backgroundComponent: renderBlurredBg } : undefined
  const backdrop = { backdropComponent: renderBackdrop }

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
      if (!isSheetReady && fromIndex === -1 && toIndex === 0) {
        setIsSheetReady(true)
      }
    },
    [hideKeyboardOnDismiss, hideKeyboardOnSwipeDown, isSheetReady]
  )

  return (
    <BaseModal
      {...background}
      {...backdrop}
      ref={modalRef}
      // This is required for android to make scrollable containers work
      // and allow closing the modal by dragging the content
      // (adding this property on iOS breaks closing the modal by dragging the content)
      activeOffsetY={IS_ANDROID ? [-DRAG_ACTIVATION_OFFSET, DRAG_ACTIVATION_OFFSET] : undefined}
      animatedPosition={animatedPosition}
      backgroundStyle={
        hideHandlebar
          ? BottomSheetStyle.modalTransparent
          : {
              backgroundColor: backgroundColorValue,
            }
      }
      contentHeight={animatedContentHeight}
      enableContentPanningGesture={isDismissible}
      enableHandlePanningGesture={isDismissible}
      handleComponent={renderHandleBar}
      handleHeight={animatedHandleHeight}
      snapPoints={animatedSnapPoints}
      stackBehavior={stackBehavior}
      topInset={renderBehindInset ? undefined : insets.top}
      onAnimate={onAnimate}
      onDismiss={onClose}>
      <Trace logImpression modal={name}>
        <BottomSheetView
          style={[
            {
              height: fullScreen ? fullScreenContentHeight : undefined,
              backgroundColor: backgroundColorValue,
            },
            BottomSheetStyle.view,
            ...(renderBehindInset
              ? [BottomSheetStyle.behindInset, animatedBorderRadius]
              : hideHandlebar
              ? [hiddenHandlebarStyle]
              : []),
          ]}
          onLayout={handleContentLayout}>
          <BottomSheetContextProvider isSheetReady={isSheetReady}>
            {children}
          </BottomSheetContextProvider>
        </BottomSheetView>
      </Trace>
    </BaseModal>
  )
}

export function BottomSheetDetachedModal({
  children,
  name,
  onClose,
  snapPoints = CONTENT_HEIGHT_SNAP_POINTS,
  stackBehavior = 'push',
  isDismissible = true,
  dismissOnBackPress = true,
  fullScreen,
  hideHandlebar,
  backgroundColor,
}: Props): JSX.Element {
  const insets = useSafeAreaInsets()
  const modalRef = useRef<BaseModal>(null)
  const { animatedHandleHeight, animatedSnapPoints, animatedContentHeight, handleContentLayout } =
    useBottomSheetDynamicSnapPoints(snapPoints)
  const colors = useSporeColors()

  const fullScreenContentHeight = FULL_HEIGHT * dimensions.fullHeight

  useModalBackHandler(modalRef, isDismissible && dismissOnBackPress)

  useEffect(() => {
    modalRef.current?.present()
    // Close modal when it is unmounted
    return modalRef.current?.close
  }, [modalRef])

  const renderHandleBar = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props: any) => {
      return <HandleBar {...props} backgroundColor={backgroundColor} hidden={hideHandlebar} />
    },
    [backgroundColor, hideHandlebar]
  )

  return (
    <BaseModal
      ref={modalRef}
      // This is required for android to make scrollable containers work
      // and allow closing the modal by dragging the content
      // (adding this property on iOS breaks closing the modal by dragging the content)
      activeOffsetY={IS_ANDROID ? [-DRAG_ACTIVATION_OFFSET, DRAG_ACTIVATION_OFFSET] : undefined}
      backdropComponent={Backdrop}
      backgroundStyle={
        hideHandlebar
          ? BottomSheetStyle.modalTransparent
          : {
              backgroundColor: backgroundColor ?? colors.surface1.val,
            }
      }
      bottomInset={spacing.spacing48}
      contentHeight={animatedContentHeight}
      detached={true}
      enableContentPanningGesture={isDismissible}
      handleComponent={renderHandleBar}
      handleHeight={animatedHandleHeight}
      snapPoints={animatedSnapPoints}
      stackBehavior={stackBehavior}
      style={BottomSheetStyle.detached}
      topInset={insets.top}
      onDismiss={onClose}>
      <Trace logImpression modal={name}>
        <BottomSheetView
          style={[
            {
              height: fullScreen ? fullScreenContentHeight : undefined,
            },
            BottomSheetStyle.view,
          ]}
          onLayout={handleContentLayout}>
          {children}
        </BottomSheetView>
      </Trace>
    </BaseModal>
  )
}

const BottomSheetStyle = StyleSheet.create({
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
  view: {
    flex: 1,
  },
})

const BlurViewStyle = StyleSheet.create({
  base: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
})
