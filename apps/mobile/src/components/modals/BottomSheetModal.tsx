import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetHandleProps,
  BottomSheetModal as BaseModal,
  BottomSheetView,
  useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet'
import { BlurView } from 'expo-blur'
import React, {
  ComponentProps,
  forwardRef,
  PropsWithChildren,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import {
  BackHandler,
  Keyboard,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { BottomSheetContextProvider } from 'src/components/modals/BottomSheetContext'
import { HandleBar } from 'src/components/modals/HandleBar'
import Trace from 'src/components/Trace/Trace'
import { IS_ANDROID, IS_IOS } from 'src/constants/globals'
import { ModalName } from 'src/features/telemetry/constants'
import { useKeyboardLayout } from 'src/utils/useKeyboardLayout'
import {
  DynamicColor,
  Flex,
  useDeviceDimensions,
  useDeviceInsets,
  useMedia,
  useSporeColors,
} from 'ui/src'
import { borderRadii, spacing } from 'ui/src/theme'
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
  animatedPosition?: Animated.SharedValue<number>
  hideHandlebar?: boolean
  name: ModalName
  onClose?: () => void
  snapPoints?: Array<string | number>
  stackBehavior?: ComponentProps<typeof BaseModal>['stackBehavior']
  containerComponent?: ComponentProps<typeof BaseModal>['containerComponent']
  footerComponent?: ComponentProps<typeof BaseModal>['footerComponent']
  fullScreen?: boolean
  backgroundColor?: DynamicColor
  blurredBackground?: boolean
  dismissOnBackPress?: boolean
  isDismissible?: boolean
  overrideInnerContainer?: boolean
  renderBehindTopInset?: boolean
  renderBehindBottomInset?: boolean
  hideKeyboardOnDismiss?: boolean
  hideKeyboardOnSwipeDown?: boolean
  // extend the sheet to its maximum snap point when keyboard is visible
  extendOnKeyboardVisible?: boolean
}>

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

const CONTENT_HEIGHT_SNAP_POINTS = ['CONTENT_HEIGHT']

export type BottomSheetModalRef = {
  handleContentLayout: (event: LayoutChangeEvent) => void
}

export const BottomSheetModal = forwardRef<BottomSheetModalRef, Props>(function BottomSheetModal(
  {
    children,
    name,
    onClose,
    snapPoints = CONTENT_HEIGHT_SNAP_POINTS,
    stackBehavior = 'push',
    animatedPosition: providedAnimatedPosition,
    containerComponent,
    footerComponent,
    fullScreen,
    hideHandlebar,
    backgroundColor,
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
  },
  ref
): JSX.Element {
  const dimensions = useDeviceDimensions()
  const insets = useDeviceInsets()
  const modalRef = useRef<BaseModal>(null)
  const keyboard = useKeyboardLayout()

  const { animatedHandleHeight, animatedSnapPoints, animatedContentHeight, handleContentLayout } =
    useBottomSheetDynamicSnapPoints(snapPoints)
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

  const internalAnimatedPosition = useSharedValue(0)
  const animatedPosition = providedAnimatedPosition ?? internalAnimatedPosition

  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()
  const media = useMedia()

  const backgroundColorValue = blurredBackground
    ? colors.transparent.val
    : backgroundColor ?? colors.surface1.get()

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
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
        {IS_IOS ? (
          <BlurView
            intensity={90}
            style={blurViewStyle.base}
            tint={isDarkMode ? 'dark' : 'light'}
          />
        ) : (
          <Flex fill bg="$surface2" />
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

  useImperativeHandle(
    ref,
    () => ({
      handleContentLayout,
    }),
    [handleContentLayout]
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
      backgroundStyle={backgroundStyle}
      containerComponent={containerComponent}
      contentHeight={animatedContentHeight}
      enableContentPanningGesture={isDismissible}
      enableHandlePanningGesture={isDismissible}
      footerComponent={footerComponent}
      handleComponent={renderHandleBar}
      handleHeight={animatedHandleHeight}
      snapPoints={animatedSnapPoints}
      stackBehavior={stackBehavior}
      topInset={renderBehindTopInset ? 0 : insets.top}
      onAnimate={onAnimate}
      onDismiss={onClose}>
      <Trace logImpression modal={name}>
        {overrideInnerContainer ? (
          children
        ) : (
          <BottomSheetView style={bottomSheetViewStyles} onLayout={handleContentLayout}>
            <BottomSheetContextProvider isSheetReady={isSheetReady}>
              {children}
            </BottomSheetContextProvider>
          </BottomSheetView>
        )}
      </Trace>
    </BaseModal>
  )
})

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
  const insets = useDeviceInsets()
  const dimensions = useDeviceDimensions()
  const modalRef = useRef<BaseModal>(null)
  const colors = useSporeColors()

  const { animatedHandleHeight, animatedSnapPoints, animatedContentHeight, handleContentLayout } =
    useBottomSheetDynamicSnapPoints(snapPoints)

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
      activeOffsetY={IS_ANDROID ? [-DRAG_ACTIVATION_OFFSET, DRAG_ACTIVATION_OFFSET] : undefined}
      backdropComponent={Backdrop}
      backgroundStyle={backgroundStyle}
      bottomInset={insets.bottom}
      contentHeight={animatedContentHeight}
      detached={true}
      enableContentPanningGesture={isDismissible}
      handleComponent={renderHandleBar}
      handleHeight={animatedHandleHeight}
      snapPoints={animatedSnapPoints}
      stackBehavior={stackBehavior}
      style={bottomSheetStyle.detached}
      topInset={insets.top}
      onDismiss={onClose}>
      <Trace logImpression modal={name}>
        <BottomSheetView
          style={fullScreen ? { height: fullContentHeight } : undefined}
          onLayout={handleContentLayout}>
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
