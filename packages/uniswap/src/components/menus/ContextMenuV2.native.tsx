import isEqual from 'lodash/isEqual'
import { Fragment, PropsWithChildren, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import { AnimatePresence, Flex, Portal, Separator, TouchableArea, useWindowDimensions } from 'ui/src'
import { DropdownMenuSheetItem } from 'ui/src/components/dropdownMenuSheet/DropdownMenuSheetItem'
import { zIndexes } from 'ui/src/theme'
import { ContextMenuProps } from 'uniswap/src/components/menus/ContextMenuV2'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { logger } from 'utilities/src/logger/logger'

// used for positioning
const CONTEXT_MENU_WIDTH = 205
const MIN_MENU_PADDING = 15
const MENU_OPTION_HEIGHT = 40
const MENU_OPTION_GAP = 4
const MENU_PADDING = 8

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
}: PropsWithChildren<ContextMenuProps>): JSX.Element {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()

  const [isAboveTrigger, setIsAboveTrigger] = useState(isPlacementAbove)

  const isLongPress = triggerMode === ContextMenuTriggerMode.Secondary
  const triggerRef = useRef<View>(null)

  // used to control the visibility of the menu to allow for position calculations to complete before rendering
  const [isMenuVisible, setIsMenuVisible] = useState(false)

  const handleMenuClose = useCallback(() => {
    // used to delay unmount of the menu until the animation is done
    closeMenu()
    setTimeout(() => {
      setIsMenuVisible(false)
    }, ANIMATION_TIME)
  }, [closeMenu, setIsMenuVisible])

  const [position, setPosition] = useState<{
    left: number | undefined
    top: number | undefined
  }>({ left: 0, top: 0 })

  const recalculateMenuPosition = useCallback((): void => {
    if (isOpen && triggerRef.current) {
      triggerRef.current.measure((_fx, _fy, triggerWidth, triggerHeight, triggerX, triggerY) => {
        const maxUsableWidth = screenWidth - MIN_MENU_PADDING

        const getLeft = (): number => {
          const left: number = isPlacementRight
            ? triggerX + triggerWidth + offsetX // align *left* edge of menu to *right* edge of trigger
            : triggerX + triggerWidth - offsetX - CONTEXT_MENU_WIDTH // align *right* edge of menu to *right* edge of trigger

          // if menu overflows too far off the screen, clamp to edge of screen +/- MIN_MENU_PADDING
          if (left > maxUsableWidth - CONTEXT_MENU_WIDTH) {
            return maxUsableWidth - CONTEXT_MENU_WIDTH
          } else if (left < MIN_MENU_PADDING) {
            return MIN_MENU_PADDING
          }
          return left
        }

        // lazy eval to avoid unnecessary calculations
        const estimatedMenuHeight =
          menuItems.length * MENU_OPTION_HEIGHT + MENU_OPTION_GAP * (menuItems.length - 1) + MENU_PADDING * 2

        const getTop = (): number => {
          const aboveTriggerY: number = triggerY - estimatedMenuHeight - offsetY
          const belowTriggerY: number = triggerY + triggerHeight + offsetY

          if (aboveTriggerY < MIN_MENU_PADDING) {
            // if the menu overflows too far up off the screen, display below trigger
            setIsAboveTrigger(false)
            return belowTriggerY
          } else if (belowTriggerY + estimatedMenuHeight > screenHeight - MIN_MENU_PADDING) {
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
  }, [isOpen, screenWidth, menuItems.length, isPlacementRight, offsetX, offsetY, isPlacementAbove, screenHeight])

  useLayoutEffect(() => {
    recalculateMenuPosition()
  }, [recalculateMenuPosition])

  const menuSheetItems = useMemo(() => {
    return menuItems?.map(
      (
        { label, textColor, Icon, iconColor, disabled: itemDisabled, onPress: onPressAction, showDivider, closeDelay },
        index,
      ) => (
        <Fragment key={index}>
          {showDivider && <Separator my="$spacing6" />}
          <DropdownMenuSheetItem
            key={index}
            variant="medium"
            label={label}
            textColor={textColor}
            icon={Icon && <Icon size="$icon.24" color={iconColor} />}
            height={MENU_OPTION_HEIGHT}
            disabled={itemDisabled}
            closeDelay={(closeDelay ?? 0) + ANIMATION_TIME}
            handleCloseMenu={() => {
              closeMenu()
              setIsMenuVisible(false)
            }}
            onPress={() => {
              try {
                // run both actions; `onPressAny` will not run if `onPressAction` throws
                onPressAction?.()
                onPressAny?.({ name: label, index, indexPath: [index] })
              } catch (error) {
                logger.error(error, {
                  tags: { file: 'ContextMenuV2.tsx', function: 'createPressHandler' },
                })
              }
            }}
          />
        </Fragment>
      ),
    )
  }, [closeMenu, menuItems, onPressAny])

  // the idea is that we cover the whole screen with a transparent area that closes the menu when pressed
  // and we have a child on top of that that is the actual menu
  // since only one of them can be pressed at a time, we don't have to worry about the event being propagated
  return (
    <>
      <Portal
        display={isOpen || isMenuVisible ? 'flex' : 'none'}
        contain="none"
        position="unset"
        // pass events through if menu is fading out
        pointerEvents={!isOpen ? 'none' : 'auto'}
        onPress={(e) => {
          e.stopPropagation()
        }}
      >
        <Flex
          height="100%"
          width="100%"
          top={0}
          left={0}
          backgroundColor="transparent"
          zIndex={zIndexes.overlay}
          onPress={handleMenuClose}
        >
          <AnimatePresence>
            {isMenuVisible && (
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
                <Flex
                  backgroundColor="$surface1"
                  p={MENU_PADDING}
                  borderRadius="$rounded20"
                  borderColor="$surface3"
                  borderWidth="$spacing1"
                  gap={MENU_OPTION_GAP}
                  alignItems="flex-start"
                  width={CONTEXT_MENU_WIDTH}
                  shadowRadius="$spacing4"
                  shadowColor="$shadowColor"
                >
                  {menuSheetItems}
                </Flex>
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
            onLongPress={isLongPress ? openMenu : undefined}
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
