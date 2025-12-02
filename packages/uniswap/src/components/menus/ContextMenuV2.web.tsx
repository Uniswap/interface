import { Fragment, PropsWithChildren, useRef, useState } from 'react'
import { Popover } from 'ui/src'
import { MenuContent } from 'uniswap/src/components/menus/ContextMenuContent'
import { ContextMenuProps } from 'uniswap/src/components/menus/ContextMenuV2'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { isMobileWeb } from 'utilities/src/platform'
import { useOnClickOutside } from 'utilities/src/react/hooks'

export function ContextMenu({
  menuItems,
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
}: PropsWithChildren<ContextMenuProps>): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerContainerRef = useRef<HTMLDivElement>(null)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })

  const isLeftClick = triggerMode === ContextMenuTriggerMode.Primary

  useOnClickOutside({
    node: containerRef,
    handler: closeMenu,
    event: isLeftClick ? 'mouseup' : 'mousedown',
  })

  const onContextMenu = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (disabled) {
      return
    }

    e.preventDefault()
    e.stopPropagation()
    openMenu?.()

    // Capture raw click coords
    const { clientX, clientY } = e
    setMenuPosition({ x: clientX, y: clientY })
  }

  function getRelativeCoordinates(): { x: number; y: number } {
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
  }

  const { x, y } = getRelativeCoordinates()

  if (disabled || isMobileWeb) {
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
            ? 'top-start' // above & to the right
            : 'top-end' // above & to the left
          : isPlacementRight
            ? 'bottom-start' // below & to the right
            : 'bottom-end' // below & to the left
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
        {/* biome-ignore  lint/correctness/noRestrictedElements: needed here */}
        <div ref={triggerContainerRef} onContextMenu={isLeftClick ? undefined : onContextMenu}>
          {children}
        </div>
      </Popover.Trigger>
      <Popover.Content
        ref={containerRef}
        key={`${menuPosition.x}-${menuPosition.y}`} // This key ensures that the component re-renders when the menu position changes so we get a re-animation
        backgroundColor="transparent"
        animation="125ms"
        enterStyle={{
          opacity: 0,
          scale: 0.98,
          transform: [{ translateY: -4 }],
        }}
      >
        <MenuContent items={menuItems} handleCloseMenu={closeMenu} />
      </Popover.Content>
    </Popover>
  )
}
