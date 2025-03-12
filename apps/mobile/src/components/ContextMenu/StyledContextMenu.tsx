import isEqual from 'lodash/isEqual'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { Flex, GeneratedIcon, Portal, Text, TouchableArea, useWindowDimensions } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { logger } from 'utilities/src/logger/logger'

// used for positioning
const CONTEXT_MENU_WIDTH = 200
const MIN_MENU_PADDING = 20
const MENU_OPTION_HEIGHT = 40
const MENU_OPTION_GAP = 4
const MENU_PADDING = 8

// used for animation
const ANIMATION_START_POINT = 10

function MenuOption({
  title,
  icon,
  onPress,
  iconColor,
  destructive = false,
}: {
  title: string
  onPress: () => void
  destructive?: boolean
  icon?: GeneratedIcon
  iconColor?: string
}): JSX.Element {
  const Icon = icon

  return (
    <TouchableArea width="100%" p={5} height={MENU_OPTION_HEIGHT} onPress={onPress}>
      <Flex row flex={1} alignItems="center" gap="$gap12">
        {Icon && <Icon color={destructive ? '$statusCritical' : iconColor} size="$icon.24" />}
        <Text color={destructive ? '$statusCritical' : undefined} variant="body2" fontWeight="$medium">
          {title}
        </Text>
      </Flex>
    </TouchableArea>
  )
}

export type StyledContextMenuAction = {
  title: string
  destructive?: boolean
  icon?: GeneratedIcon
  iconColor?: string
  onPress?: () => void
}

type StyledContextMenuProps = {
  actions: StyledContextMenuAction[]
  children: JSX.Element
  isAboveTrigger?: boolean
  isOpen: boolean
  closeMenu: () => void
  openMenu?: () => void
  onPressAny?: (e: { name: string; index: number; indexPath: number[] }) => void
}

/**
 * A controlled styled context menu component.
 * Accepts both a onPress prop for each action and a onPressAny prop that is called when any action is pressed.
 * TODO(WALL-3692): replace the native context menu once it covers all current use cases.
 *
 * @param children the trigger element
 * @param actions the menu options
 * @param onPressAny called when any menu option is pressed. will not be called if the onPress prop of the action throws
 * @param isOpen
 * @param closeMenu
 * @param openMenu only required if the trigger does not open the menu
 * @param isAboveTrigger whether the menu should be above the trigger
 * @returns a fragment with a context menu and a trigger
 */
export function StyledContextMenu({
  children,
  actions,
  onPressAny,
  isOpen,
  closeMenu,
  openMenu,
  isAboveTrigger = false,
}: StyledContextMenuProps): JSX.Element {
  const { width: screenWidth } = useWindowDimensions()

  const triggerRef = useRef<View>(null)

  const [position, setPosition] = useState<{
    left: number | undefined
    top: number | undefined
  }>({ left: 0, top: 0 })

  const recalculateMenuPosition = useCallback((): void => {
    if (triggerRef.current) {
      triggerRef.current.measure((_fx, _fy, _triggerWidth, triggerHeight, triggerX, triggerY) => {
        const maxUsableWidth = screenWidth - MIN_MENU_PADDING
        const pxOverflowRight = triggerX + CONTEXT_MENU_WIDTH - maxUsableWidth
        const left = pxOverflowRight > 0 ? triggerX - pxOverflowRight : triggerX

        // lazy eval to avoid unnecessary calculations
        const estimatedMenuHeight =
          actions.length * MENU_OPTION_HEIGHT + MENU_OPTION_GAP * (actions.length - 1) + MENU_PADDING * 2

        const top = isAboveTrigger ? triggerY - estimatedMenuHeight - MIN_MENU_PADDING : triggerY + triggerHeight

        setPosition((prev) => {
          const updated = { ...prev }

          updated.left = Math.max(left, 0)
          updated.top = Math.max(top, 0)

          // prevent unnecessary re-renders if the position has not changed
          if (isEqual(prev, { left, top })) {
            return prev
          }

          return updated
        })
      })
    }
  }, [screenWidth, isAboveTrigger, actions.length])

  useLayoutEffect(() => {
    if (isOpen) {
      recalculateMenuPosition()
    }
  }, [recalculateMenuPosition, isOpen])

  const createPressHandler = (index: number): (() => void) => {
    const action = actions?.[index]

    if (!action) {
      return closeMenu
    }

    const { title, onPress: onPressAction } = action
    return () => {
      try {
        // run both actions; `onPressAny` will not run if `onPressAction` throws
        onPressAction?.()
        onPressAny?.({ name: title, index, indexPath: [index] })
      } catch (error) {
        logger.error(error, {
          tags: { file: 'StyledContextMenu.tsx', function: 'createPressHandler' },
        })
      } finally {
        // close the menu no matter what
        closeMenu()
      }
    }
  }

  // the idea is that we cover the whole screen with a transparent area that closes the menu when pressed
  // and we have a child on top of that that is the actual menu
  // since only one of them can be pressed at a time, we don't have to worry about the event being propagated
  return (
    <>
      <Portal display={isOpen ? 'flex' : 'none'} contain="none" position="unset" onPress={(e) => e.stopPropagation()}>
        <Flex
          height="100%"
          width="100%"
          top={0}
          left={0}
          backgroundColor="transparent"
          style={{ position: 'fixed' }}
          zIndex={zIndexes.overlay}
          onPress={closeMenu}
        >
          {isOpen && (
            <TouchableArea
              flex={1}
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
                {actions?.map((action, index) => (
                  <MenuOption
                    key={action.title}
                    title={action.title}
                    icon={action.icon}
                    iconColor={action.iconColor}
                    destructive={action.destructive}
                    onPress={createPressHandler(index)}
                  />
                ))}
              </Flex>
            </TouchableArea>
          )}
        </Flex>
      </Portal>

      <Flex>
        <TouchableArea onPress={openMenu}>
          <Flex ref={triggerRef} onLayout={recalculateMenuPosition}>
            {children}
          </Flex>
        </TouchableArea>
      </Flex>
    </>
  )
}
