import { MenuContent } from 'components/menus/ContextMenuContent'
import { BaseSyntheticEvent, PropsWithChildren, useRef, useState } from 'react'
import { FlexProps, GeneratedIcon, IconProps, Popover, PopperProps, TextProps, TouchableAreaProps } from 'ui/src'

export type MenuOptionItem = {
  label: string
  onPress: (e: BaseSyntheticEvent) => void
  textProps?: TextProps
  Icon?: GeneratedIcon | ((props: IconProps) => JSX.Element)
  showDivider?: boolean
} & TouchableAreaProps

type ContextMenuProps = {
  menuItems: MenuOptionItem[]
  menuStyleProps?: FlexProps
  onLeftClick?: boolean
  alignContentLeft?: boolean
} & PopperProps

export function ContextMenu({
  children,
  menuItems,
  menuStyleProps,
  onLeftClick = false,
  alignContentLeft = false,
  ...rest
}: PropsWithChildren<ContextMenuProps>): JSX.Element {
  const triggerContainerRef = useRef<HTMLDivElement>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })

  const onContextMenu = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault()
    e.stopPropagation()
    setShowMenu(true)

    // Capture raw click coords
    const { clientX, clientY } = e
    setMenuPosition({ x: clientX, y: clientY })
  }

  function getRelativeCoordinates() {
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

  return (
    <Popover
      open={showMenu}
      strategy="absolute"
      placement={alignContentLeft ? 'bottom-end' : 'bottom-start'}
      offset={{ mainAxis: y, crossAxis: x }}
      {...rest}
      onOpenChange={(next) => setShowMenu(next)}
    >
      <Popover.Trigger>
        <div
          ref={triggerContainerRef}
          onClick={onLeftClick ? onContextMenu : undefined}
          onContextMenu={onLeftClick ? undefined : onContextMenu}
        >
          {children}
        </div>
      </Popover.Trigger>
      <Popover.Content
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
