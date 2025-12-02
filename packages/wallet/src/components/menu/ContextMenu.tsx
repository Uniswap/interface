import { PropsWithChildren, SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react'
import { GetProps, Popover, PopperProps, Portal } from 'ui/src'
import { Flex, FlexProps } from 'ui/src/components/layout'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { zIndexes } from 'ui/src/theme'
import { useEvent, usePrevious } from 'utilities/src/react/hooks'
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

const popoverContentAnimation: GetProps<typeof Popover.Content>['animation'] = [
  'quick',
  {
    opacity: {
      overshootClamping: true,
    },
  },
]

const popoverEnterAndExitStyle: GetProps<typeof Popover.Content>['enterStyle'] = {
  y: -10,
  opacity: 0,
}

const portalFlexChildStyle: FlexProps['style'] = {
  position: 'fixed',
}

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

  const contentShadowProps = useMemo(
    () => ({
      shadowColor: colors.shadowColor.val,
      shadowRadius: 12,
      shadowOpacity: 0.1,
    }),
    [colors.shadowColor.val],
  )

  const handleHideMenu = useEvent(() => {
    setShowMenu(false)
  })

  // Note: Overlay needs to be rendered in portal since parent transforms don't let fixed elements target the viewport
  // see: https://stackoverflow.com/a/15256339
  return (
    <Popover allowFlip offset={offset} open={showMenu} placement="bottom-end" {...rest}>
      {/* OVERLAY */}
      {/* Conditional rendering needs to be used here instead of CSS so that portals aren't duplicated */}
      {showMenu && (
        <Portal>
          <Flex
            height="100vh"
            left={0}
            opacity={1}
            pointerEvents="auto"
            style={portalFlexChildStyle}
            top={0}
            width="100vh"
            zIndex={zIndexes.modalBackdrop}
            onPress={handleHideMenu}
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
        animation={popoverContentAnimation}
        borderColor="$surface3"
        borderRadius="$rounded16"
        borderWidth="$spacing1"
        enableRemoveScroll={true}
        enterStyle={popoverEnterAndExitStyle}
        exitStyle={popoverEnterAndExitStyle}
        p="$none"
        {...contentShadowProps}
        {...menuContainerStyleProps}
      >
        {/* biome-ignore lint/correctness/noRestrictedElements: probably we can replace it here */}
        <div>
          <MenuContent items={menuOptions} onClose={closeOnClick ? handleHideMenu : undefined} {...menuStyleProps} />
        </div>
        <Popover.Arrow backgroundColor="transparent" />
      </Popover.Content>
    </Popover>
  )
}
