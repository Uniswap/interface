import { PropsWithChildren, SyntheticEvent, useEffect, useRef, useState } from 'react'
import { Popover, PopperProps, Portal } from 'ui/src'
import { Flex, FlexProps } from 'ui/src/components/layout'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { zIndexes } from 'ui/src/theme'
import { usePrevious } from 'utilities/src/react/hooks'
import { MenuContent } from 'wallet/src/components/menu/MenuContent'
import { MenuContentItem } from 'wallet/src/components/menu/types'

const DEFAULT_OFFSET_TOKEN_BALANCE_HEIGHT = 60

type ContextMenuProps = {
  menuOptions: MenuContentItem[]
  itemId: string
  menuStyleProps?: FlexProps
  menuContainerStyleProps?: FlexProps
  onLeftClick?: boolean
  closeOnClick?: boolean
  hoverable?: boolean
} & PopperProps

/**
 * Base component for a context menu shown on right click.
 * Expected use is to wrap a component that will trigger the context menu.
 *
 * Pass empty object to `offset` to place the modal below the trigger element.
 */
export function ContextMenu({
  children,
  menuOptions,
  menuStyleProps,
  menuContainerStyleProps,
  itemId,
  onLeftClick = false,
  closeOnClick = false,
  ...rest
}: PropsWithChildren<ContextMenuProps>): JSX.Element {
  const lastItemId = usePrevious(itemId)
  const colors = useSporeColors()
  const [showMenu, setShowMenu] = useState(false)

  // Close the menu if this component was recycled to show a different item
  useEffect(() => {
    if (lastItemId && itemId !== lastItemId) {
      setShowMenu(false)
    }
  }, [itemId, lastItemId])

  const onContextMenu = (e: SyntheticEvent<Element>): void => {
    e.preventDefault()
    e.stopPropagation()
    setShowMenu(true)
  }

  // Offset the content by the height of the trigger element, so its aligned to the top
  // Ignore if any values besides default are passed
  const triggerContainerRef = useRef<HTMLDivElement>(null)
  const { offset: customOffset, placement } = rest
  const isOffsetProvided = customOffset || (placement !== 'bottom-end' && placement)
  const triggerOffsetHeight = triggerContainerRef.current?.offsetHeight ?? 0
  const triggerBottomPosition = triggerContainerRef.current?.getBoundingClientRect().bottom ?? 0
  const isTriggerBelowViewport = window.innerHeight - triggerBottomPosition < 0
  const fallbackOffset = -triggerOffsetHeight + (triggerOffsetHeight || DEFAULT_OFFSET_TOKEN_BALANCE_HEIGHT)
  const offset = isOffsetProvided ? customOffset : isTriggerBelowViewport ? fallbackOffset : -triggerOffsetHeight

  const contentShadowProps = {
    shadowColor: colors.shadowColor.val,
    shadowRadius: 12,
    shadowOpacity: 0.1,
  }

  // Note: Overlay needs to be rendered in portal since parent transforms don't let fixed elements target the viewport
  // see: https://stackoverflow.com/a/15256339
  return (
    <Popover allowFlip offset={offset} open={showMenu} placement="bottom-end" {...rest}>
      {/* OVERLAY */}
      {/* Conditional rendering needs to be used here instead of CSS so that portals aren't duplicated */}
      {showMenu && (
        <Portal contain="none" position="unset" onPress={(e) => e.stopPropagation()}>
          <Flex
            height="100vh"
            left={0}
            opacity={1}
            pointerEvents="auto"
            style={{ position: 'fixed' }}
            top={0}
            width="100vh"
            zIndex={zIndexes.modalBackdrop}
            onPress={() => setShowMenu(false)}
          />
        </Portal>
      )}
      {/* TRIGGER/BUTTON */}
      <Popover.Trigger>
        {/* biome-ignore lint/correctness/noRestrictedElements: probably we can replace it here */}
        <div
          ref={triggerContainerRef}
          onClick={onLeftClick ? onContextMenu : undefined}
          onContextMenu={onLeftClick ? undefined : onContextMenu}
        >
          {children}
        </div>
      </Popover.Trigger>
      {/* CONTENT */}
      <Popover.Content
        animation={[
          'quick',
          {
            opacity: {
              overshootClamping: true,
            },
          },
        ]}
        borderColor="$surface3"
        borderRadius="$rounded16"
        borderWidth="$spacing1"
        disableRemoveScroll={false}
        enterStyle={{ y: -10, opacity: 0 }}
        exitStyle={{ y: -10, opacity: 0 }}
        p="$none"
        {...contentShadowProps}
        {...menuContainerStyleProps}
      >
        {/* biome-ignore lint/correctness/noRestrictedElements: probably we can replace it here */}
        <div>
          <MenuContent
            items={menuOptions}
            onClose={closeOnClick ? (): void => setShowMenu(false) : undefined}
            {...menuStyleProps}
          />
        </div>
        <Popover.Arrow backgroundColor="transparent" />
      </Popover.Content>
    </Popover>
  )
}
