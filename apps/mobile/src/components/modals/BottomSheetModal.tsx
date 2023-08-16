import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal as BaseModal,
  BottomSheetView,
  useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet'
import { useResponsiveProp } from '@shopify/restyle'
import React, { ComponentProps, PropsWithChildren, useCallback, useEffect, useRef } from 'react'
import { Keyboard, StyleSheet } from 'react-native'
import { Extrapolate, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppTheme } from 'src/app/hooks'
import { HandleBar } from 'src/components/modals/HandleBar'
import Trace from 'src/components/Trace/Trace'
import { IS_ANDROID } from 'src/constants/globals'
import { ModalName } from 'src/features/telemetry/constants'
import { useKeyboardLayout } from 'src/utils/useKeyboardLayout'
import { dimensions } from 'ui/src/theme/restyle/sizing'
import { theme as FixedTheme } from 'ui/src/theme/restyle/theme'
import { spacing } from 'ui/src/theme/spacing'

type Props = PropsWithChildren<{
  disableSwipe?: boolean
  hideHandlebar?: boolean
  name: ModalName
  onClose?: () => void
  snapPoints?: Array<string | number>
  stackBehavior?: ComponentProps<typeof BaseModal>['stackBehavior']
  fullScreen?: boolean
  backgroundColor?: string
  transparentBackground?: boolean
  isDismissible?: boolean
  renderBehindInset?: boolean
  hideKeyboardOnDismiss?: boolean
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
  transparentBackground = false,
  isDismissible = true,
  renderBehindInset = false,
  hideKeyboardOnDismiss = false,
  // keyboardBehavior="extend" does not work and it's hard to figure why,
  // probably it requires usage of <BottomSheetTextInput>
  extendOnKeyboardVisible = false,
}: Props): JSX.Element {
  const insets = useSafeAreaInsets()
  const modalRef = useRef<BaseModal>(null)

  const keyboard = useKeyboardLayout()
  useEffect(() => {
    if (extendOnKeyboardVisible && keyboard.isVisible) {
      modalRef.current?.expand()
    }
  }, [extendOnKeyboardVisible, keyboard.isVisible])

  const { animatedHandleHeight, animatedSnapPoints, animatedContentHeight, handleContentLayout } =
    useBottomSheetDynamicSnapPoints(snapPoints)
  const animatedPosition = useSharedValue(0)
  const theme = useAppTheme()

  const backgroundColorValue = transparentBackground
    ? theme.colors.none
    : backgroundColor ?? theme.colors.surface2

  const renderBackdrop = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={BACKDROP_APPEARS_ON_INDEX}
        disappearsOnIndex={DISAPPEARS_ON_INDEX}
        opacity={transparentBackground ? 0.2 : 0.4}
        pressBehavior={isDismissible ? 'close' : 'none'}
      />
    ),
    [transparentBackground, isDismissible]
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

  useEffect(() => {
    modalRef.current?.present()
  }, [modalRef])

  let fullScreenContentHeight = (renderBehindInset ? 1 : FULL_HEIGHT) * dimensions.fullHeight
  if (IS_ANDROID) {
    fullScreenContentHeight += insets.top
  }

  const borderRadius = useResponsiveProp({
    // on screens without rounded corners, remove rounded corners when modal is fullscreen
    xs: theme.borderRadii.none,
    sm: theme.borderRadii.rounded24,
  })

  const animatedBorderRadius = useAnimatedStyle(() => {
    const interpolatedRadius = interpolate(
      animatedPosition.value,
      [0, insets.top],
      [0, borderRadius ?? theme.borderRadii.rounded24],
      Extrapolate.CLAMP
    )
    return { borderTopLeftRadius: interpolatedRadius, borderTopRightRadius: interpolatedRadius }
  })

  const backdrop = { backdropComponent: renderBackdrop }

  // onAnimated is called when the sheet is about to animate to a new position.
  // `About to` is crucial here, cause we want to start hiding the keyboard during the process of hiding the sheet.
  // See here: https://gorhom.github.io/react-native-bottom-sheet/props#onanimate
  //
  // onDismiss on the other hand is called when a sheet is already closed, hence too late for us here.
  const onAnimate = useCallback(
    (fromIndex: number, toIndex: number): void => {
      if (hideKeyboardOnDismiss && toIndex === DISAPPEARS_ON_INDEX) {
        Keyboard.dismiss()
      }
    },
    [hideKeyboardOnDismiss]
  )

  return (
    <BaseModal
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
            ...(renderBehindInset ? [BottomSheetStyle.behindInset, animatedBorderRadius] : []),
          ]}
          onLayout={handleContentLayout}>
          {children}
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
  fullScreen,
  hideHandlebar,
  backgroundColor,
}: Props): JSX.Element {
  const insets = useSafeAreaInsets()
  const modalRef = useRef<BaseModal>(null)
  const { animatedHandleHeight, animatedSnapPoints, animatedContentHeight, handleContentLayout } =
    useBottomSheetDynamicSnapPoints(snapPoints)
  const theme = useAppTheme()

  const fullScreenContentHeight = FULL_HEIGHT * dimensions.fullHeight

  useEffect(() => {
    modalRef.current?.present()
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
              backgroundColor: backgroundColor ?? theme.colors.surface1,
            }
      }
      bottomInset={theme.spacing.spacing48}
      contentHeight={animatedContentHeight}
      detached={true}
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
