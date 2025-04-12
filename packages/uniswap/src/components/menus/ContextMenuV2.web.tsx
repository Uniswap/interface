import { Fragment, PropsWithChildren, useRef, useState } from 'react'
import { Popover } from 'ui/src'
import { MenuContent } from 'uniswap/src/components/menus/ContextMenuContent'
import { ContextMenuProps } from 'uniswap/src/components/menus/ContextMenuV2'
import { isMobileWeb } from 'utilities/src/platform'
import { useOnClickOutside } from 'utilities/src/react/hooks'

export function ContextMenu({
  children,
  menuItems,
  menuStyleProps,
  onLeftClick = false,
  alignContentLeft = false,
  disabled = false,
  ...rest
}: PropsWithChildren<ContextMenuProps>): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerContainerRef = useRef<HTMLDivElement>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })

  useOnClickOutside(containerRef, () => {
    setShowMenu(false)
  })

  const onContextMenu = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (disabled) {
      return
    }

    e.preventDefault()
    e.stopPropagation()
    setShowMenu(true)

    // Capture raw click coords
    const { clientX, clientY } = e
    setMenuPosition({ x: clientX, y: clientY })
  }

  function getRelativeCoordinates(): { x: number; y: number } {
    if (!triggerContainerRef.current) {
      return { x: 0, y: 0 }
    }

    const rect = triggerContainerRef.current.getBoundingClientRect()
    const relativeX = alignContentLeft ? menuPosition.x - rect.right : menuPosition.x - rect.left
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
      open={showMenu}
      strategy="absolute"
      placement={alignContentLeft ? 'bottom-end' : 'bottom-start'}
      offset={{ mainAxis: y, crossAxis: x }}
      {...rest}
    >
      {/*
        We attach the context menu event handler conditionally:
        - If onLeftClick is true, we use onMouseDown to open the menu on left-click.
        - Otherwise, we use onContextMenu to open the menu on right-click.
        This ensures that left-click events are not blocked from propagating,
        keeping normal click behavior intact.
      */}
      <Popover.Trigger onMouseDown={onLeftClick ? onContextMenu : undefined}>
        {/* eslint-disable-next-line react/forbid-elements */}
        <div ref={triggerContainerRef} onContextMenu={onLeftClick ? undefined : onContextMenu}>
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
        <MenuContent
          items={menuItems}
          onItemClick={() => {
            setShowMenu(false)
          }}
          {...menuStyleProps}
        />
      </Popover.Content>
    </Popover>
  )
}
