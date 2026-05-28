import { isWebApp } from '@universe/environment'
import { Fragment, PropsWithChildren, useRef, useState } from 'react'
import { AdaptiveWebPopoverContent, Popover, RemoveScroll, useMedia } from 'ui/src'
import { ContextMenuProps } from 'uniswap/src/components/menus/ContextMenu'
import { MENU_CONTENT_SHEET_CONTAINER_STYLES, MenuContent } from 'uniswap/src/components/menus/ContextMenuContent'
import { useContextMenuTracking } from 'uniswap/src/components/menus/hooks/useContextMenuTracking'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { useEvent, useOnClickOutside } from 'utilities/src/react/hooks'

export function ContextMenu({
  menuItems,
  contentOverride,
  isPlacementAbove = false,
  isPlacementRight = false,
  offsetX = 0,
  offsetY = 0,
  triggerMode,
  disabled = false,
  children,
  isOpen,
  closeMenu,
  openMenu,
  elementName,
  sectionName,
  trackItemClicks,
  adaptToSheet = true,
}: PropsWithChildren<ContextMenuProps>): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerContainerRef = useRef<HTMLDivElement>(null)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const media = useMedia()

  const isSheet = isWebApp && media.sm && adaptToSheet
  const isLeftClick = triggerMode === ContextMenuTriggerMode.Primary

  const handleCloseMenu = useContextMenuTracking({
    isOpen,
    closeMenu,
    elementName,
    sectionName,
  })

  // Skip click-outside handling when showing as sheet (sheet has its own dismiss handling via overlay).
  // Use capture so we run before modal/sheet handlers that stopPropagation (e.g. when menu is inside transaction-details modal).
  useOnClickOutside({
    node: containerRef,
    handler: isSheet ? undefined : handleCloseMenu,
    event: isLeftClick ? 'mouseup' : 'mousedown',
    ignoredNodes: [triggerContainerRef],
    capture: true,
  })

  const onContextMenu = useEvent((e: React.MouseEvent<HTMLDivElement>): void => {
    if (disabled) {
      return
    }

    e.preventDefault()
    e.stopPropagation()

    // Toggle: close if already open, otherwise open
    if (isOpen) {
      handleCloseMenu()
      return
    }

    openMenu?.()

    // Capture raw click coords
    const { clientX, clientY } = e
    setMenuPosition({ x: clientX, y: clientY })
  })

  // Prevent click events from propagating to parent elements (e.g., TouchableArea)
  const onClickCapture = useEvent((e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault()
    e.stopPropagation()
  })

  // Prevent native browser context menu from appearing
  const onPreventContextMenu = useEvent((e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault()
    e.stopPropagation()
  })

  const getRelativeCoordinates = useEvent(() => {
    if (isLeftClick || !triggerContainerRef.current) {
      return { x: 0, y: 0 }
    }

    const rect = triggerContainerRef.current.getBoundingClientRect()
    const relativeX = isPlacementRight ? menuPosition.x - rect.left : menuPosition.x - rect.right
    const relativeY = menuPosition.y - rect.top - rect.height

    return {
      x: relativeX,
      y: relativeY,
    }
  })

  const { x, y } = getRelativeCoordinates()

  if (disabled) {
    return <Fragment>{children}</Fragment>
  }

  return (
    <Popover
      allowFlip
      open={isOpen}
      strategy="absolute"
      placement={
        isPlacementAbove
          ? isPlacementRight
            ? 'top-start'
            : 'top-end'
          : isPlacementRight
            ? 'bottom-start'
            : 'bottom-end'
      }
      offset={{
        mainAxis: y + (isPlacementAbove ? -offsetY : offsetY),
        crossAxis: x + (isPlacementRight ? offsetX : -offsetX),
      }}
    >
      {/*
        We attach the context menu event handler conditionally:
        - If onLeftClick is true, we use onMouseDown to open the menu on left-click.
        - Otherwise, we use onContextMenu to open the menu on right-click.
        This ensures that left-click events are not blocked from propagating,
        keeping normal click behavior intact.
      */}
      <Popover.Trigger onMouseDown={isLeftClick ? onContextMenu : undefined}>
        {/* oxlint-disable-next-line react/forbid-elements -- needed here */}
        <div
          ref={triggerContainerRef}
          onContextMenu={isLeftClick ? onPreventContextMenu : onContextMenu}
          onClick={isLeftClick ? onClickCapture : undefined}
        >
          {children}
        </div>
      </Popover.Trigger>

      <RemoveScroll blockScrollEvents enabled={isOpen && !isSheet && isWebApp} shards={[containerRef]} />

      <AdaptiveWebPopoverContent
        ref={containerRef}
        key={`${menuPosition.x}-${menuPosition.y}`} // This key ensures that the component re-renders when the menu position changes so we get a re-animation
        backgroundColor="transparent"
        p="$none"
        py="$spacing8"
        isOpen={isOpen}
        isSheet={isSheet}
        webBottomSheetProps={{ onClose: handleCloseMenu }}
      >
        {contentOverride ?? (
          <MenuContent
            containerStyles={isSheet ? MENU_CONTENT_SHEET_CONTAINER_STYLES : undefined}
            items={menuItems}
            handleCloseMenu={handleCloseMenu}
            elementName={elementName}
            sectionName={sectionName}
            trackItemClicks={trackItemClicks}
          />
        )}
      </AdaptiveWebPopoverContent>
    </Popover>
  )
}
