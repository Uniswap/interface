import isEqual from 'lodash/isEqual'
import { Fragment, PropsWithChildren, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { NativeSyntheticEvent, View } from 'react-native'
import { AnimatePresence, Flex, Portal, Separator, TouchableArea, useWindowDimensions } from 'ui/src'
import { DropdownMenuSheetItem } from 'ui/src/components/dropdownMenuSheet/DropdownMenuSheetItem'
import { spacing, zIndexes } from 'ui/src/theme'
import { ContextMenuProps } from 'uniswap/src/components/menus/ContextMenuV2'
import { useContextMenuTracking } from 'uniswap/src/components/menus/hooks/useContextMenuTracking'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { useHapticFeedback } from 'uniswap/src/features/settings/useHapticFeedback/useHapticFeedback'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

const MIN_CONTEXT_MENU_WIDTH = 205

// used for positioning
const MIN_MENU_PADDING = spacing.spacing16

// used for animation
const ANIMATION_START_POINT = 10
const ANIMATION_TIME = 200

/**
 * A controlled styled context menu component.
 * Accepts both a onPress prop for each action and a onPressAny prop that is called when any action is pressed.
 * TODO(WALL-3692): replace the native context menu once it covers all current use cases.
 * @param children the trigger element
 * @returns a fragment with a context menu and a trigger
 */
export function ContextMenu({
  children,
  menuItems,
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
}: PropsWithChildren<ContextMenuProps>): JSX.Element {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const maxUsableWidth = screenWidth - MIN_MENU_PADDING
  const maxMenuWidth = maxUsableWidth * 0.8 // Design spec: max width should be 80% of usable screen space

  const [isAboveTrigger, setIsAboveTrigger] = useState(isPlacementAbove)

  const isLongPress = triggerMode === ContextMenuTriggerMode.Secondary
  const triggerRef = useRef<View>(null)

  const { hapticFeedback } = useHapticFeedback()
  const trace = useTrace()

  // Menu measurement and visibility states
  const [measuredMenuDimensions, setMeasuredMenuDimensions] = useState<{ width: number; height: number } | null>(null)
  const [isMenuVisible, setIsMenuVisible] = useState(false)

  const trackedCloseMenu = useContextMenuTracking({
    isOpen,
    closeMenu,
    elementName,
    sectionName,
  })

  const handleMenuClose = useCallback(() => {
    // used to delay unmount of the menu until the animation is done
    trackedCloseMenu()
    setTimeout(() => {
      setIsMenuVisible(false)
      setMeasuredMenuDimensions(null) // Reset dimensions for next open
    }, ANIMATION_TIME)
  }, [trackedCloseMenu])

  const [position, setPosition] = useState<{
    left: number | undefined
    top: number | undefined
  }>({ left: 0, top: 0 })

  // Handle menu layout measurement
  const handleMenuLayout = useEvent((event: NativeSyntheticEvent<{ layout: { width: number; height: number } }>) => {
    const { width, height } = event.nativeEvent.layout
    setMeasuredMenuDimensions({ width, height })
  })

  const recalculateMenuPosition = useCallback((): void => {
    if (isOpen && triggerRef.current && measuredMenuDimensions) {
      // eslint-disable-next-line max-params
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

        // Show menu after position is calculated
        setTimeout(() => {
          setIsMenuVisible(true)
        }, 0)
      })
    }
  }, [
    isOpen,
    isPlacementRight,
    offsetX,
    maxUsableWidth,
    offsetY,
    screenHeight,
    isPlacementAbove,
    measuredMenuDimensions,
  ])

  useLayoutEffect(() => {
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
            height={height ?? spacing.spacing40}
            disabled={itemDisabled}
            destructive={destructive}
            closeDelay={(closeDelay ?? 0) + ANIMATION_TIME}
            handleCloseMenu={handleMenuClose}
            onPress={() => {
              // close the menu first to allow the closing animation to trigger asap
              setIsMenuVisible(false)
              closeMenu()
              // pushes the main action (problematic navigation action) to the end of the event loop
              // to allow the menu to close properly before
              setTimeout(() => {
                try {
                  // run both actions; `onPressAny` will not run if `onPressAction` throws
                  onPressAction()
                  onPressAny?.({ name: label, index, indexPath: [index] })
                  // Track analytics if enabled
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
                    tags: { file: 'ContextMenuV2.tsx', function: 'createPressHandler' },
                  })
                }
              }, ANIMATION_TIME)
            }}
            {...otherProps}
          />
        </Fragment>
      ),
    )
  }, [handleMenuClose, menuItems, onPressAny, trackItemClicks, elementName, sectionName, trace, closeMenu])

  // Render the menu content component
  const MenuContent = useCallback(
    () => (
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
    [maxMenuWidth, menuSheetItems],
  )

  // the idea is that we cover the whole screen with a transparent area that closes the menu when pressed
  // and we have a child on top of that that is the actual menu
  // since only one of them can be pressed at a time, we don't have to worry about the event being propagated
  return (
    <>
      <Portal>
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
          {/* Hidden pre-render for measurement */}
          {!measuredMenuDimensions && (
            <Flex
              position="absolute"
              top={-9999} // Render off-screen
              left={-9999}
              opacity={0}
              onLayout={handleMenuLayout}
            >
              <MenuContent />
            </Flex>
          )}

          {/* Visible menu */}
          <AnimatePresence>
            {isMenuVisible && measuredMenuDimensions && (
              <Flex
                justifyContent="flex-start"
                alignItems="flex-start"
                backgroundColor="$transparent"
                top={position.top}
                left={position.left}
                position="absolute"
                animation="200ms"
                enterStyle={{
                  opacity: 0,
                  y: isAboveTrigger ? ANIMATION_START_POINT : -ANIMATION_START_POINT,
                }}
                exitStyle={{
                  opacity: 0,
                  y: isAboveTrigger ? ANIMATION_START_POINT : -ANIMATION_START_POINT,
                }}
              >
                <MenuContent />
              </Flex>
            )}
          </AnimatePresence>
        </Flex>
      </Portal>

      <Flex>
        {openMenu ? (
          <TouchableArea
            disabled={disabled}
            onPress={isLongPress ? undefined : openMenu}
            onLongPress={
              isLongPress
                ? async (): Promise<void> => {
                    await hapticFeedback.success()
                    openMenu()
                  }
                : undefined
            }
          >
            <Flex ref={triggerRef} onLayout={recalculateMenuPosition}>
              {children}
            </Flex>
          </TouchableArea>
        ) : (
          // if openMenu is undefined, {children} controls menu open/close state. Don't want to interfere with nested TouchableAreas
          <Flex ref={triggerRef} onLayout={recalculateMenuPosition}>
            {children}
          </Flex>
        )}
      </Flex>
    </>
  )
}
