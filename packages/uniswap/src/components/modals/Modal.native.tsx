import type { BottomSheetBackdropProps, BottomSheetHandleProps } from '@gorhom/bottom-sheet'
import {
  BottomSheetModal as BaseModal,
  BottomSheetBackdrop,
  BottomSheetView,
  // biome-ignore lint/style/noRestrictedImports: legacy import will be migrated
  BottomSheetTextInput as GorhomBottomSheetTextInput,
} from '@gorhom/bottom-sheet'
import { BlurView } from 'expo-blur'
import type { ComponentProps } from 'react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { BackHandler, StyleSheet } from 'react-native'
import Animated, { Extrapolate, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { Flex, useIsDarkMode, useMedia, useSporeColors } from 'ui/src'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { borderRadii, spacing, zIndexes } from 'ui/src/theme'
import { BottomSheetContextProvider } from 'uniswap/src/components/modals/BottomSheetContext'
import { HandleBar } from 'uniswap/src/components/modals/HandleBar'
import type { ModalProps } from 'uniswap/src/components/modals/ModalProps'
import { BSM_ANIMATION_CONFIGS, IS_SHEET_READY_DELAY } from 'uniswap/src/components/modals/modalConstants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { useKeyboardLayout } from 'uniswap/src/utils/useKeyboardLayout'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { isIOS } from 'utilities/src/platform'

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

    return undefined
  }, [modalRef, enabled])
}

const BACKDROP_APPEARS_ON_INDEX = 0
const DISAPPEARS_ON_INDEX = -1

function ModalBackdrop({
  fullScreen,
  zIndex,
  hideScrim,
  blurredBackground,
  isDismissible,
  ...props
}: BottomSheetBackdropProps &
  Pick<ModalProps, 'fullScreen' | 'zIndex' | 'hideScrim' | 'blurredBackground' | 'isDismissible'>): JSX.Element {
  return (
    <BottomSheetBackdrop
      {...props}
      style={useMemo(
        () =>
          StyleSheet.flatten([
            props.style,
            { zIndex: fullScreen ? undefined : zIndex ? zIndex - 1 : zIndexes.modalBackdrop },
          ]),
        [fullScreen, zIndex, props.style],
      )}
      appearsOnIndex={BACKDROP_APPEARS_ON_INDEX}
      disappearsOnIndex={DISAPPEARS_ON_INDEX}
      opacity={hideScrim ? 0 : blurredBackground ? 0.2 : 0.4}
      pressBehavior={isDismissible ? 'close' : 'none'}
    />
  )
}

function DetachedModalBackdrop(props: BottomSheetBackdropProps): JSX.Element {
  return (
    <BottomSheetBackdrop
      {...props}
      style={useMemo(() => StyleSheet.flatten([props.style, { zIndex: zIndexes.popoverBackdrop }]), [props.style])}
      appearsOnIndex={BACKDROP_APPEARS_ON_INDEX}
      disappearsOnIndex={DISAPPEARS_ON_INDEX}
      opacity={0.4}
    />
  )
}

export function Modal({ isModalOpen = true, ...props }: ModalProps): JSX.Element | null {
  if (!isModalOpen) {
    return null
  }

  return <BottomSheetModalContents {...props} />
}

function BottomSheetModalContents({
  children,
  name,
  onClose,
  snapPoints: providedSnapPoints,
  stackBehavior = 'push',
  animatedPosition: providedAnimatedPosition,
  containerComponent,
  footerComponent,
  focusHook,
  fullScreen,
  hideHandlebar,
  backgroundColor,
  handlebarColor,
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
  forceRoundedCorners = false,
  // keyboardBehavior="extend" does not work and it's hard to figure why,
  // probably it requires usage of <BottomSheetTextInput>
  extendOnKeyboardVisible = false,
  hideScrim = false,
  analyticsProperties,
  skipLogImpression,
  zIndex,
}: ModalProps): JSX.Element {
  const insets = useAppInsets()
  const media = useMedia()
  const keyboard = useKeyboardLayout()
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()

  const modalRef = useRef<BaseModal>(null)
  const internalAnimatedPosition = useSharedValue(0)
  const [isSheetReady, setIsSheetReady] = useState(false)

  const snapPoints = useMemo(
    () => providedSnapPoints ?? (fullScreen ? ['100%'] : undefined),
    [providedSnapPoints, fullScreen],
  )

  useModalBackHandler(modalRef, isDismissible && dismissOnBackPress)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    modalRef.current?.present?.()
    // Close modal when it is unmounted
    return modalRef.current?.close
  }, [])

  useEffect(() => {
    if (extendOnKeyboardVisible && keyboard.isVisible) {
      modalRef.current?.expand()
    }
  }, [extendOnKeyboardVisible, keyboard.isVisible])

  const animatedPosition = providedAnimatedPosition ?? internalAnimatedPosition

  const backgroundColorValue = blurredBackground ? colors.transparent.val : (backgroundColor ?? colors.surface1.val)

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <ModalBackdrop
        fullScreen={fullScreen}
        zIndex={zIndex}
        hideScrim={hideScrim}
        blurredBackground={blurredBackground}
        isDismissible={isDismissible}
        {...props}
      />
    ),
    [fullScreen, zIndex, hideScrim, blurredBackground, isDismissible],
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
          indicatorColor={handlebarColor}
          backgroundColor={backgroundColorValue}
          containerFlexStyles={{
            paddingBottom: spacing.spacing12,
            paddingTop: spacing.spacing16,
          }}
          hidden={hideHandlebar}
        />
      )
    },
    [backgroundColorValue, handlebarColor, hideHandlebar, renderBehindTopInset],
  )

  const animatedBorderRadius = useAnimatedStyle(() => {
    const interpolatedRadius = interpolate(
      animatedPosition.value,
      [0, insets.top],
      [0, borderRadius],
      Extrapolate.CLAMP,
    )
    return { borderTopLeftRadius: interpolatedRadius, borderTopRightRadius: interpolatedRadius }
  })

  const renderBlurredBg = useCallback(
    () => (
      <Animated.View style={[blurViewStyle.base, animatedBorderRadius]}>
        {isIOS ? (
          <BlurView intensity={90} style={blurViewStyle.base} tint={isDarkMode ? 'dark' : 'light'} />
        ) : (
          <Flex fill backgroundColor="$surface2" />
        )}
      </Animated.View>
    ),
    [isDarkMode, animatedBorderRadius],
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
        dismissNativeKeyboard()
      }

      // When a sheet has too much content it can lag and take a while to begin opening, so we want to delay rendering some of the content until the sheet is ready.
      // We consider the sheet to be "ready" as soon as it starts animating from the bottom to the top.
      // We add a short delay given that this callback is called when the sheet is "about to" animate.
      // Note: We tried to use BottomSheet.onChange but this caused some issues with the sheet not being
      // scrollable sometimes.
      if (!isSheetReady && fromIndex === -1 && toIndex === 0) {
        setTimeout(() => setIsSheetReady(true), IS_SHEET_READY_DELAY)
      }
    },
    [hideKeyboardOnDismiss, hideKeyboardOnSwipeDown, isSheetReady],
  )

  // on screens < xs (iPhone SE), assume no rounded corners on screen and remove rounded corners from fullscreen modal
  const borderRadius = media.short ? borderRadii.none : borderRadii.rounded24

  const backgroundStyle = useMemo(
    () => ({
      backgroundColor: backgroundColorValue,
    }),
    [backgroundColorValue],
  )

  const bottomSheetViewStyles: StyleProp<ViewStyle> = useMemo(() => {
    const styles: StyleProp<ViewStyle> = [{ backgroundColor: backgroundColorValue }]

    const hiddenHandlebarStyle = {
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
    }

    if (renderBehindTopInset) {
      styles.push(bottomSheetStyle.behindInset)

      if (hideHandlebar) {
        if (forceRoundedCorners) {
          styles.push(hiddenHandlebarStyle)
        } else {
          styles.push(animatedBorderRadius)
        }
      }
    } else if (hideHandlebar) {
      styles.push(hiddenHandlebarStyle)
    }

    if (!renderBehindBottomInset) {
      styles.push({ paddingBottom: insets.bottom })
    }
    // When in fullScreen mode, set a fixed height to fill the available space
    // (when not in fullScreen, we use dynamic sizing based on content)
    if (fullScreen) {
      styles.push({ height: '100%' })
    }

    return styles
  }, [
    backgroundColorValue,
    borderRadius,
    renderBehindTopInset,
    hideHandlebar,
    renderBehindBottomInset,
    fullScreen,
    forceRoundedCorners,
    animatedBorderRadius,
    insets.bottom,
  ])

  const containerStyle = useMemo(() => {
    return { zIndex: fullScreen ? undefined : zIndex ? zIndex : zIndexes.modal }
  }, [fullScreen, zIndex])

  return (
    <BaseModal
      ref={modalRef}
      backgroundComponent={blurredBackground ? renderBlurredBg : undefined}
      backdropComponent={renderBackdrop}
      accessible={false}
      animatedPosition={animatedPosition}
      backgroundStyle={backgroundStyle}
      containerComponent={containerComponent}
      containerStyle={containerStyle}
      enableContentPanningGesture={isDismissible}
      enableDynamicSizing={!snapPoints || enableDynamicSizing}
      enableHandlePanningGesture={isDismissible}
      footerComponent={footerComponent}
      handleComponent={renderHandleBar}
      snapPoints={snapPoints}
      stackBehavior={stackBehavior}
      topInset={renderBehindTopInset ? 0 : insets.top}
      animationConfigs={BSM_ANIMATION_CONFIGS}
      onAnimate={onAnimate}
      onDismiss={onClose}
    >
      <Trace logImpression={!skipLogImpression} modal={name} properties={analyticsProperties}>
        <BottomSheetContextProvider isSheetReady={isSheetReady}>
          {overrideInnerContainer ? (
            children
          ) : (
            <BottomSheetView style={bottomSheetViewStyles} focusHook={focusHook}>
              {children}
            </BottomSheetView>
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
  analyticsProperties,
}: ModalProps): JSX.Element {
  const insets = useAppInsets()
  const dimensions = useDeviceDimensions()
  const modalRef = useRef<BaseModal>(null)
  const colors = useSporeColors()

  useModalBackHandler(modalRef, isDismissible && dismissOnBackPress)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    modalRef.current?.present?.()
    // Close modal when it is unmounted
    return modalRef.current?.close
  }, [])

  const renderHandleBar = useCallback(
    (props: BottomSheetHandleProps) => {
      return <HandleBar {...props} backgroundColor={backgroundColor} hidden={hideHandlebar} />
    },
    [backgroundColor, hideHandlebar],
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
      backdropComponent={DetachedModalBackdrop}
      backgroundStyle={backgroundStyle}
      bottomInset={insets.bottom}
      containerStyle={bottomSheetStyle.detachedContainer}
      detached={true}
      enableContentPanningGesture={isDismissible}
      enableDynamicSizing={!snapPoints}
      handleComponent={renderHandleBar}
      snapPoints={snapPoints}
      stackBehavior={stackBehavior}
      style={bottomSheetStyle.detached}
      topInset={insets.top}
      onDismiss={onClose}
    >
      <Trace logImpression modal={name} properties={analyticsProperties}>
        <BottomSheetView style={fullScreen ? { height: fullContentHeight } : undefined}>{children}</BottomSheetView>
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
  detachedContainer: {
    zIndex: zIndexes.popover,
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

export function BottomSheetTextInput(props: ComponentProps<typeof GorhomBottomSheetTextInput>): JSX.Element {
  return <GorhomBottomSheetTextInput {...props} />
}
