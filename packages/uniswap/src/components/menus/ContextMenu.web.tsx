import { isWebApp } from '@universe/environment'
import {
  ForwardedRef,
  forwardRef,
  Fragment,
  PropsWithChildren,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AdaptiveWebPopoverContent, Popover, RemoveScroll, useMedia } from 'ui/src'
import { ContextMenuHandle, ContextMenuProps } from 'uniswap/src/components/menus/ContextMenu'
import { MENU_CONTENT_SHEET_CONTAINER_STYLES, MenuContent } from 'uniswap/src/components/menus/ContextMenuContent'
import { useContextMenuTracking } from 'uniswap/src/components/menus/hooks/useContextMenuTracking'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { useEvent, useOnClickOutside } from 'utilities/src/react/hooks'

function ContextMenuWebInner(
  {
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
  }: PropsWithChildren<ContextMenuProps>,
  ref: ForwardedRef<ContextMenuHandle>,
): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerContainerRef = useRef<HTMLDivElement>(null)
  // Stable reference so useOnClickOutside doesn't re-subscribe on every render.
  const ignoredNodes = useMemo(() => [triggerContainerRef], [])
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  // True once a real position (right-click or openAt) has been captured, independent of triggerMode.
  const [hasExplicitPosition, setHasExplicitPosition] = useState(false)
  const media = useMedia()

  const isSheet = isWebApp && media.sm && adaptToSheet
  const isLeftClick = triggerMode === ContextMenuTriggerMode.Primary

  const handleCloseMenu = useContextMenuTracking({
    isOpen,
    closeMenu,
    elementName,
    sectionName,
  })

  // A right-click's own trailing mouseup can land outside triggerContainerRef and get misread as an outside
  // click, closing the menu we just opened. This flag suppresses that one mouseup.
  const suppressNextOutsideCloseRef = useRef(false)
  const armSuppressNextOutsideClose = useEvent((): void => {
    suppressNextOutsideCloseRef.current = true
  })

  const handleOutsideClick = useEvent((): void => {
    if (suppressNextOutsideCloseRef.current) {
      suppressNextOutsideCloseRef.current = false
      return
    }
    handleCloseMenu()
  })

  // Skip click-outside handling when showing as sheet (sheet has its own dismiss handling via overlay).
  // Use capture so we run before modal/sheet handlers that stopPropagation (e.g. when menu is inside transaction-details modal).
  useOnClickOutside({
    node: containerRef,
    handler: isSheet ? undefined : handleOutsideClick,
    event: isLeftClick ? 'mouseup' : 'mousedown',
    ignoredNodes,
    capture: true,
  })

  // Primary mode's own trigger (e.g. a "…" button): always anchored to the trigger, not the click position.
  // Clears hasExplicitPosition on open, not on close, so it doesn't reposition mid exit-animation.
  const openMenuAnchored = useEvent((): void => {
    if (disabled) {
      return
    }

    if (isOpen) {
      handleCloseMenu()
      return
    }

    openMenu?.()
    setHasExplicitPosition(false)
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
    armSuppressNextOutsideClose()

    // Capture raw click coords
    const { clientX, clientY } = e
    setHasExplicitPosition(true)
    setMenuPosition({ x: clientX, y: clientY })
  })

  useImperativeHandle(
    ref,
    () => ({
      openAt: (x: number, y: number) => {
        if (disabled) {
          return
        }

        // Toggle: close if already open, otherwise open at the given coordinates
        if (isOpen) {
          handleCloseMenu()
          return
        }

        openMenu?.()
        armSuppressNextOutsideClose()
        setHasExplicitPosition(true)
        setMenuPosition({ x, y })
      },
    }),
    [disabled, isOpen, handleCloseMenu, openMenu, armSuppressNextOutsideClose],
  )

  // Prevent click events from propagating to parent elements (e.g., TouchableArea)
  const onClickCapture = useEvent((e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault()
    e.stopPropagation()
  })

  // No stopPropagation: lets a right-click on the trigger bubble to an ancestor's own onContextMenu (openAt).
  const onPreventContextMenu = useEvent((e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault()
  })

  const getRelativeCoordinates = useEvent(() => {
    if (!hasExplicitPosition || !triggerContainerRef.current) {
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
      <Popover.Trigger onMouseDown={isLeftClick ? openMenuAnchored : undefined}>
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

export const ContextMenu = forwardRef(ContextMenuWebInner)
