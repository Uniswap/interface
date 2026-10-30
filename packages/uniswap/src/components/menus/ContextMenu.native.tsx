import { isIOS } from '@universe/environment'
import {
  Flex,
  Separator,
  spacing,
  TouchableArea,
  zIndexes,
  flexStyles,
  AnimatedFlex,
  DropdownMenuSheetItem,
} from '@universe/mycelium'
import { Portal } from '@universe/mycelium/portal'
import { useIsDarkMode } from '@universe/mycelium/theme-hooks-compat'
import { withSporeCurve } from '@universe/tailwind/animations/reanimated'
import isEqual from 'lodash/isEqual'
import {
  ForwardedRef,
  forwardRef,
  Fragment,
  PropsWithChildren,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Modal, NativeSyntheticEvent, useWindowDimensions, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { FullWindowOverlay } from 'react-native-screens'
import { ContextMenuHandle, ContextMenuProps } from 'uniswap/src/components/menus/ContextMenu'
import { useContextMenuTracking } from 'uniswap/src/components/menus/hooks/useContextMenuTracking'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { useHapticFeedback } from 'uniswap/src/features/settings/useHapticFeedback/useHapticFeedback'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useOnMobileAppState } from 'utilities/src/device/appState'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

const MIN_CONTEXT_MENU_WIDTH = 205

// used for positioning
const MIN_MENU_PADDING = spacing.spacing16

// used for enter animation
const ANIMATION_START_POINT = 10

// Hoists the menu into its own native window so it paints above bottom sheets. On Android the JS
// portal host is a sibling *below* the gorhom sheet host and zIndex can't reorder across hosts,
// so a transparent RN Modal (a real dialog window) is the only layer guaranteed on top.
function MenuWindowOverlay({
  children,
  visible,
  onRequestClose,
}: PropsWithChildren<{ visible: boolean; onRequestClose: () => void }>): JSX.Element {
  if (isIOS) {
    return <FullWindowOverlay>{children}</FullWindowOverlay>
  }
  return (
    // visible must gate the dialog: an Android dialog window consumes all touches regardless of the
    // child's pointerEvents, so leaving it up while closed would freeze input app-wide.
    <Modal
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="none"
      visible={visible}
      onRequestClose={onRequestClose}
    >
      {children}
    </Modal>
  )
}

// Raw useSharedValue + mount-effect + useAnimatedStyle here, not AnimatedFlex's preferred
// entering/exiting worklets, to stay consistent with AnimatedMenuContent below - its directional
// slide can't use mycelium's fade-only native presets anyway, so this file settles on one shape.
function DimBackgroundOverlay({ isDarkMode }: { isDarkMode: boolean }): JSX.Element {
  const targetOpacity = isDarkMode ? 0.4 : 0.2
  const opacity = useSharedValue(0)
  useEffect(() => {
    opacity.value = withSporeCurve('200ms', targetOpacity)
  }, [targetOpacity, opacity])
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }), [opacity])

  return <AnimatedFlex position="absolute" inset={0} backgroundColor="$black" style={animatedStyle} />
}

function AnimatedMenuContent({
  top,
  left,
  isAboveTrigger,
  children,
}: {
  top: number | undefined
  left: number | undefined
  isAboveTrigger: boolean
  children: ReactNode
}): JSX.Element {
  const opacity = useSharedValue(0)
  // isAboveTrigger only informs the initial slide direction, read once at mount (this component
  // remounts on every open, so a stale value can't linger across opens).
  const translateY = useSharedValue(isAboveTrigger ? ANIMATION_START_POINT : -ANIMATION_START_POINT)
  useEffect(() => {
    opacity.value = withSporeCurve('200ms', 1)
    translateY.value = withSporeCurve('200ms', 0)
  }, [opacity, translateY])
  const animatedStyle = useAnimatedStyle(
    () => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }),
    [opacity, translateY],
  )

  return (
    <AnimatedFlex
      justifyContent="flex-start"
      alignItems="flex-start"
      backgroundColor="$transparent"
      top={top}
      left={left}
      position="absolute"
      style={animatedStyle}
    >
      {children}
    </AnimatedFlex>
  )
}

/**
 * A controlled styled context menu component.
 * Accepts both a onPress prop for each action and a onPressAny prop that is called when any action is pressed.
 * TODO(WALL-3692): replace the native context menu once it covers all current use cases.
 * @param children the trigger element
 * @returns a fragment with a context menu and a trigger
 */
// No native caller currently needs `openAt` — coordinate-anchored positioning is a web-only concept here.
function ContextMenuNativeInner(
  {
    children,
    menuItems,
    contentOverride,
    isPlacementAbove = false,
    isPlacementRight = false,
    offsetX = 0,
    offsetY = 0,
    onPressAny,
    triggerMode,
    disabled = false,
    isOpen,
    closeMenu,
    openMenu,
    elementName,
    sectionName,
    trackItemClicks = false,
    dimBackground = false,
  }: PropsWithChildren<ContextMenuProps>,
  _ref: ForwardedRef<ContextMenuHandle>,
): JSX.Element {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const maxUsableWidth = screenWidth - MIN_MENU_PADDING
  const maxMenuWidth = maxUsableWidth * 0.8 // Design spec: max width should be 80% of usable screen space

  const [isAboveTrigger, setIsAboveTrigger] = useState(isPlacementAbove)

  const isLongPress = triggerMode === ContextMenuTriggerMode.Secondary
  const triggerRef = useRef<View>(null)

  const { hapticFeedback } = useHapticFeedback()
  const trace = useTrace()
  const isDarkMode = useIsDarkMode()

  // Menu measurement and visibility states
  const [measuredMenuDimensions, setMeasuredMenuDimensions] = useState<{ width: number; height: number } | null>(null)
  const [isMenuVisible, setIsMenuVisible] = useState(false)

  const trackedCloseMenu = useContextMenuTracking({
    isOpen,
    closeMenu,
    elementName,
    sectionName,
  })

  const handleMenuClose = useEvent(() => {
    trackedCloseMenu()
    setIsMenuVisible(false)
    setMeasuredMenuDimensions(null) // Reset dimensions for next open
  })

  const dismissOnBackground = useEvent(() => {
    if (isOpen) {
      handleMenuClose()
    }
  })

  useOnMobileAppState('background', dismissOnBackground)

  const [position, setPosition] = useState<{
    left: number | undefined
    top: number | undefined
  }>({ left: 0, top: 0 })

  // Handle menu layout measurement
  const handleMenuLayout = useEvent((event: NativeSyntheticEvent<{ layout: { width: number; height: number } }>) => {
    const { width, height } = event.nativeEvent.layout
    setMeasuredMenuDimensions({ width, height })
  })

  const recalculateMenuPosition = useEvent((): void => {
    if (isOpen && triggerRef.current && measuredMenuDimensions) {
      // oxlint-disable-next-line max-params
      triggerRef.current.measure((_fx, _fy, triggerWidth, triggerHeight, triggerX, triggerY) => {
        const getLeft = (): number => {
          const left: number = isPlacementRight
            ? triggerX + triggerWidth + offsetX // align *left* edge of menu to *right* edge of trigger
            : triggerX + triggerWidth - offsetX - measuredMenuDimensions.width // align *right* edge of menu to *right* edge of trigger

          // if menu overflows too far off the screen, clamp to edge of screen +/- MIN_MENU_PADDING
          if (left > maxUsableWidth - measuredMenuDimensions.width) {
            return maxUsableWidth - measuredMenuDimensions.width
          } else if (left < MIN_MENU_PADDING) {
            return MIN_MENU_PADDING
          }
          return left
        }

        const getTop = (): number => {
          const aboveTriggerY: number = triggerY - measuredMenuDimensions.height - offsetY
          const belowTriggerY: number = triggerY + triggerHeight + offsetY

          if (aboveTriggerY < MIN_MENU_PADDING) {
            // if the menu overflows too far up off the screen, display below trigger
            setIsAboveTrigger(false)
            return belowTriggerY
          } else if (belowTriggerY + measuredMenuDimensions.height > screenHeight - MIN_MENU_PADDING) {
            // if the menu overflows too far down off the screen, display above trigger
            setIsAboveTrigger(true)
            return aboveTriggerY
          } else if (isPlacementAbove) {
            return aboveTriggerY
          } else {
            return belowTriggerY
          }
        }

        const left = getLeft()
        const top = getTop()
        setPosition((prev) => {
          const updated = { ...prev }

          updated.left = left
          updated.top = top

          // prevent unnecessary re-renders if the position has not changed
          if (isEqual(prev, { left, top })) {
            return prev
          }

          return updated
        })

        setIsMenuVisible(true)
      })
    }
  })

  useEffect(() => {
    if (measuredMenuDimensions) {
      recalculateMenuPosition()
    }
  }, [recalculateMenuPosition, measuredMenuDimensions])

  const menuSheetItems = useMemo(() => {
    return menuItems.map(
      (
        {
          label,
          Icon,
          iconColor,
          disabled: itemDisabled,
          onPress: onPressAction,
          showDivider,
          closeDelay,
          destructive,
          height,
          trailingIcon,
          ...otherProps
        },
        index,
      ) => (
        <Fragment key={index}>
          {showDivider && <Separator my="$spacing6" />}
          <DropdownMenuSheetItem
            key={index}
            variant="medium"
            label={label}
            icon={Icon && <Icon size="$icon.24" color={iconColor ?? (destructive ? '$statusCritical' : '$neutral2')} />}
            rightElement={trailingIcon}
            height={height ?? spacing.spacing40}
            disabled={itemDisabled}
            destructive={destructive}
            closeDelay={closeDelay ?? 0}
            handleCloseMenu={handleMenuClose}
            onPress={() => {
              setIsMenuVisible(false)
              closeMenu()
              // Defer the action to the next tick so the Portal unmounts first
              setTimeout(() => {
                try {
                  onPressAction()
                  onPressAny?.({ name: label, index, indexPath: [index] })
                  if (trackItemClicks && elementName && sectionName) {
                    sendAnalyticsEvent(UniswapEventName.ContextMenuItemClicked, {
                      element: elementName,
                      section: sectionName,
                      menu_item: label,
                      menu_item_index: index,
                      ...trace,
                    })
                  }
                } catch (error) {
                  logger.error(error, {
                    tags: { file: 'ContextMenu.tsx', function: 'createPressHandler' },
                  })
                }
              }, 0)
            }}
            {...otherProps}
          />
        </Fragment>
      ),
    )
  }, [handleMenuClose, menuItems, onPressAny, trackItemClicks, elementName, sectionName, trace, closeMenu])

  // Render the menu content component
  const MenuContent = useEvent(() =>
    contentOverride ? (
      <>{contentOverride}</>
    ) : (
      <Flex
        backgroundColor="$surface1"
        p="$spacing8"
        borderRadius="$rounded20"
        borderColor="$surface3"
        borderWidth="$spacing1"
        gap="$spacing4"
        alignItems="flex-start"
        minWidth={MIN_CONTEXT_MENU_WIDTH}
        maxWidth={maxMenuWidth}
        shadowRadius="$spacing4"
        shadowColor="$shadowColor"
      >
        {menuSheetItems}
      </Flex>
    ),
  )

  const onPress = useEvent(() => {
    if (!openMenu) {
      return
    }

    if (isLongPress) {
      // oxlint-disable-next-line typescript/no-floating-promises
      hapticFeedback.success()
    }

    openMenu()
  })

  // the idea is that we cover the whole screen with a transparent area that closes the menu when pressed
  // and we have a child on top of that that is the actual menu
  // since only one of them can be pressed at a time, we don't have to worry about the event being propagated
  return (
    <>
      {(isOpen || isMenuVisible) && (
        <Portal>
          {/* Portal escapes the app's GestureHandlerRootView, so re-root gestures here or the menu's TouchableAreas don't register. */}
          <MenuWindowOverlay visible={isOpen} onRequestClose={handleMenuClose}>
            <GestureHandlerRootView style={flexStyles.fill}>
              <Flex
                pointerEvents={!isOpen ? 'none' : 'auto'}
                height="100%"
                width="100%"
                top={0}
                left={0}
                backgroundColor="transparent"
                zIndex={zIndexes.overlay}
                onPress={handleMenuClose}
              >
                {dimBackground && isOpen && <DimBackgroundOverlay isDarkMode={isDarkMode} />}
                {/* Hidden pre-render for measurement. Plain RN View: handleMenuLayout takes the real
                    RN NativeSyntheticEvent, and FlexCompatProps types onLayout as the web synthesized shape. */}
                {!measuredMenuDimensions && (
                  <View
                    style={{ position: 'absolute', top: -9999, left: -9999, opacity: 0 }} // Render off-screen
                    onLayout={handleMenuLayout}
                  >
                    <MenuContent />
                  </View>
                )}

                {/* Visible menu */}
                {isMenuVisible && measuredMenuDimensions && (
                  <AnimatedMenuContent top={position.top} left={position.left} isAboveTrigger={isAboveTrigger}>
                    <MenuContent />
                  </AnimatedMenuContent>
                )}
              </Flex>
            </GestureHandlerRootView>
          </MenuWindowOverlay>
        </Portal>
      )}

      <Flex>
        {openMenu ? (
          <TouchableArea
            disabled={disabled}
            onPress={isLongPress ? undefined : onPress}
            onLongPress={isLongPress ? onPress : undefined}
          >
            {/* Plain RN View: recalculateMenuPosition calls the RN-only `.measure()`, and FlexCompatProps types `ref` as web-only. */}
            <View ref={triggerRef} onLayout={recalculateMenuPosition}>
              {children}
            </View>
          </TouchableArea>
        ) : (
          // if openMenu is undefined, {children} controls menu open/close state. Don't want to interfere with nested TouchableAreas
          <View ref={triggerRef} onLayout={recalculateMenuPosition}>
            {children}
          </View>
        )}
      </Flex>
    </>
  )
}

export const ContextMenu = forwardRef(ContextMenuNativeInner)
