/**
 * Web-only, drop-in replacement for the legacy `ContextMenu`
 * (`uniswap/src/components/menus/ContextMenu.web.tsx`), INFRA-3021 — a THIN
 * ADAPTER over the shadcn DropdownMenu recipe (`../shadcn/dropdown-menu`),
 * which owns the portal/positioner/popup anatomy; this layer keeps the
 * legacy behavior contract the recipe cannot know:
 *
 * - fully controlled (`isOpen`/`closeMenu`, optional `openMenu`), with the
 *   legacy toggle-on-reopen semantics for right-click and `openAt`;
 * - trigger modes: primary opens on trigger mousedown (context menu
 *   suppressed), secondary opens on right-click at the pointer position;
 * - explicit positions (right-click / `openAt`) anchor a floating-ui virtual
 *   point element — observably the same placement the legacy trigger-relative
 *   offset arithmetic produced, without the per-position remount;
 * - dismissal is owned by the compat, byte-matching the legacy microbehavior:
 *   capture-phase outside listener (beats modal handlers that stop
 *   propagation), mouseup for Primary vs mousedown for Secondary, one-shot
 *   suppression of the opening right-click's trailing mouseup; Base UI's own
 *   outside-press close requests are ignored, only Escape is honored;
 * - overlay stacking: consumes the EffectiveModalOrSheetZIndexContext
 *   equivalent, renders one layer above the host (floor 1070), re-provides —
 *   so menus inside a z-1060 modal never land behind it;
 * - `adaptToSheet` is accepted but GATED on the Sheet/Dialog track (popover
 *   presentation regardless — see the menu parity exclusions ledger);
 *   `dimBackground`/`onPressAny` stay native-only exactly like legacy web.
 *
 * The parity suite in `packages/tailwind/src/parity/menu` pins all of this.
 */
import * as React from 'react'
import { adaptiveWebPopoverContentCompatClassName } from '../popover-compat/compile'
import {
  mapOffsetToAnchorPosition,
  mapPlacementToAnchorPosition,
  type PopoverCompatPlacement,
} from '../popover-compat/position'
import { EffectiveOverlayZIndexContext, OVERLAY_Z_INDEXES, useStackingLayerAbove } from '../popover-compat/z-index'
import { DropdownMenu, DropdownMenuContent } from '../shadcn/dropdown-menu'
import { useBlockOutsideScroll, useOnClickOutsideCompat, useStableCallback } from './internal'
import { MenuCompatHostContext, MenuContentCompat } from './MenuContentCompat'
import type { ContextMenuCompatHandle, ContextMenuCompatProps } from './types'

const INSIDE_MENU = { insideMenu: true }

interface PointAnchor {
  x: number
  y: number
}

function pointAnchorRect({ x, y }: PointAnchor): DOMRect {
  return {
    x,
    y,
    top: y,
    left: x,
    right: x,
    bottom: y,
    width: 0,
    height: 0,
    toJSON: (): unknown => ({ x, y, width: 0, height: 0 }),
  } as DOMRect
}

export const ContextMenuCompat = React.forwardRef<ContextMenuCompatHandle, ContextMenuCompatProps>(
  function ContextMenuCompat(props, ref) {
    const {
      menuItems,
      contentOverride,
      isPlacementAbove = false,
      isPlacementRight = false,
      offsetX = 0,
      offsetY = 0,
      onPressAny: _onPressAny, // native-only today; inert on web like legacy
      triggerMode,
      disabled = false,
      children,
      isOpen,
      closeMenu,
      openMenu,
      elementName,
      sectionName,
      trackItemClicks,
      adaptToSheet: _adaptToSheet = true, // GATED sheet leg — popover renders regardless (ledger)
      dimBackground: _dimBackground, // native-only scrim; inert on web like legacy
      blockOutsideScroll = true, // facade seam for the legacy isWebApp scroll-lock gate (ledger)
      telemetryAdapter,
    } = props

    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const triggerContainerRef = React.useRef<HTMLDivElement | null>(null)
    // Stable reference so the outside-click hook doesn't re-subscribe every render.
    const ignoredNodes = React.useMemo(() => [triggerContainerRef], [])
    const [explicitPosition, setExplicitPosition] = React.useState<PointAnchor | undefined>(undefined)

    const isLeftClick = triggerMode === 'primary'

    // Reactive open/close reporting through the host-injected telemetry seam
    // (the legacy useContextMenuTracking fires on isOpen transitions, so every
    // close path is covered).
    const wasOpenRef = React.useRef(false)
    React.useEffect(() => {
      if (isOpen && !wasOpenRef.current) {
        telemetryAdapter?.onMenuOpened?.({ elementName, sectionName })
      } else if (!isOpen && wasOpenRef.current) {
        telemetryAdapter?.onMenuClosed?.({ elementName, sectionName })
      }
      wasOpenRef.current = isOpen
    }, [isOpen, telemetryAdapter, elementName, sectionName])

    const handleCloseMenu = useStableCallback((): void => {
      closeMenu()
    })

    // In primary mode the outside listener is mouseup, so the opening
    // interaction's own trailing mouseup can land outside the trigger and get
    // misread as an outside click, closing the menu we just opened. This flag
    // suppresses that one event. Secondary mode never arms it: its listener
    // is mousedown, which the opening right-click cannot re-fire.
    const suppressNextOutsideCloseRef = React.useRef(false)
    const armSuppressNextOutsideClose = useStableCallback((): void => {
      suppressNextOutsideCloseRef.current = true
    })

    const handleOutsideClick = useStableCallback((): void => {
      if (suppressNextOutsideCloseRef.current) {
        suppressNextOutsideCloseRef.current = false
        return
      }
      handleCloseMenu()
    })

    // The arm must not outlive the open it protects: if the opening
    // interaction's trailing mouseup lands INSIDE the popup, the outside
    // listener never consumes it, and a stale arm would swallow the next
    // open's first outside dismissal (parity suite pins this).
    React.useEffect(() => {
      if (!isOpen) {
        suppressNextOutsideCloseRef.current = false
      }
    }, [isOpen])

    // Capture phase so this runs before modal/sheet handlers that
    // stopPropagation (e.g. a menu inside the transaction-details modal).
    useOnClickOutsideCompat({
      node: containerRef,
      handler: disabled ? undefined : handleOutsideClick,
      event: isLeftClick ? 'mouseup' : 'mousedown',
      ignoredNodes,
      capture: true,
    })

    // RemoveScroll stand-in: block page scroll outside the open menu. The
    // legacy isWebApp gate is applied by conversion facades through
    // `blockOutsideScroll` (ledger).
    useBlockOutsideScroll({ node: containerRef, enabled: isOpen && !disabled && blockOutsideScroll })

    // Primary mode's own trigger (e.g. a "…" button): anchored to the trigger,
    // not the click position. Clears the explicit position on open, not close,
    // so it doesn't reposition mid exit-animation.
    const openMenuAnchored = useStableCallback((): void => {
      if (disabled) {
        return
      }
      if (isOpen) {
        handleCloseMenu()
        return
      }
      openMenu?.()
      setExplicitPosition(undefined)
    })

    const onContextMenu = useStableCallback((e: React.MouseEvent<HTMLDivElement>): void => {
      if (disabled) {
        return
      }
      e.preventDefault()
      e.stopPropagation()
      // Toggle: close if already open, otherwise open at the pointer.
      if (isOpen) {
        handleCloseMenu()
        return
      }
      openMenu?.()
      // No suppression arm here: in secondary mode the outside listener is
      // mousedown, and the opening right-click's mousedown already landed
      // inside triggerContainerRef (ignored) — arming would swallow the
      // user's next real outside mousedown instead.
      setExplicitPosition({ x: e.clientX, y: e.clientY })
    })

    React.useImperativeHandle(
      ref,
      () => ({
        openAt: (x: number, y: number): void => {
          if (disabled) {
            return
          }
          if (isOpen) {
            handleCloseMenu()
            return
          }
          openMenu?.()
          // Primary mode listens on mouseup, so the opening interaction's
          // trailing mouseup needs the one-shot suppression; secondary mode
          // listens on mousedown, which the opener never re-fires.
          if (isLeftClick) {
            armSuppressNextOutsideClose()
          }
          setExplicitPosition({ x, y })
        },
      }),
      [disabled, isOpen, isLeftClick, handleCloseMenu, openMenu, armSuppressNextOutsideClose],
    )

    // Prevent click events from propagating to parent elements (e.g. row touchables).
    const onClickCapture = useStableCallback((e: React.MouseEvent<HTMLDivElement>): void => {
      e.preventDefault()
      e.stopPropagation()
    })

    // No stopPropagation: lets a right-click on the trigger bubble to an
    // ancestor's own onContextMenu (openAt).
    const onPreventContextMenu = useStableCallback((e: React.MouseEvent<HTMLDivElement>): void => {
      e.preventDefault()
    })

    // Base UI requests closes through onOpenChange; the compat owns outside
    // dismissal itself (exact legacy event/phase semantics), so only the
    // Escape request is honored — matching the legacy Tamagui default.
    const handleMenuOpenChange = useStableCallback(
      (nextOpen: boolean, eventDetails: { reason?: string } | undefined): void => {
        if (!nextOpen && eventDetails?.reason === 'escape-key') {
          handleCloseMenu()
        }
      },
    )

    const stackingLayerNumber = useStackingLayerAbove(OVERLAY_Z_INDEXES.popover)

    const placement: PopoverCompatPlacement = isPlacementAbove
      ? isPlacementRight
        ? 'top-start'
        : 'top-end'
      : isPlacementRight
        ? 'bottom-start'
        : 'bottom-end'
    const { side, align } = mapPlacementToAnchorPosition(placement)
    const { sideOffset, alignOffset } = mapOffsetToAnchorPosition({
      offset: {
        mainAxis: isPlacementAbove ? -offsetY : offsetY,
        crossAxis: isPlacementRight ? offsetX : -offsetX,
      },
      align,
    })

    const anchor = React.useMemo(() => {
      if (explicitPosition === undefined) {
        return triggerContainerRef
      }
      return { getBoundingClientRect: (): DOMRect => pointAnchorRect(explicitPosition) }
    }, [explicitPosition])

    if (disabled) {
      return <React.Fragment>{children}</React.Fragment>
    }

    return (
      <DropdownMenu open={isOpen} onOpenChange={handleMenuOpenChange} modal={false}>
        {/*
          The trigger handlers mirror the legacy split: primary uses mousedown
          so left-click behavior stays intact; secondary uses contextmenu.
        */}
        {/* oxlint-disable-next-line react/forbid-elements -- verbatim port of the legacy trigger container div */}
        <div
          ref={triggerContainerRef}
          data-slot="context-menu-compat-trigger"
          onMouseDown={isLeftClick ? openMenuAnchored : undefined}
          onContextMenu={isLeftClick ? onPreventContextMenu : onContextMenu}
          onClick={isLeftClick ? onClickCapture : undefined}
        >
          {children}
        </div>

        <DropdownMenuContent
          unstyled
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          positionerProps={{
            'data-slot': 'context-menu-compat-positioner',
            'data-explicit-anchor':
              explicitPosition === undefined ? undefined : `${explicitPosition.x},${explicitPosition.y}`,
            className: 'isolate outline-none',
            anchor,
            style: { zIndex: stackingLayerNumber },
          }}
          ref={containerRef}
          data-slot="context-menu-compat-popup"
          // Legacy menus never move focus; ledgered with the a11y upgrade.
          finalFocus={false}
          className={adaptiveWebPopoverContentCompatClassName({
            backgroundColor: 'transparent',
            p: '$none',
            py: '$spacing8',
            placement,
          })}
        >
          <EffectiveOverlayZIndexContext.Provider value={stackingLayerNumber}>
            <MenuCompatHostContext.Provider value={INSIDE_MENU}>
              {contentOverride ?? (
                <MenuContentCompat
                  items={menuItems}
                  handleCloseMenu={handleCloseMenu}
                  elementName={elementName}
                  sectionName={sectionName}
                  trackItemClicks={trackItemClicks}
                  telemetryAdapter={telemetryAdapter}
                />
              )}
            </MenuCompatHostContext.Provider>
          </EffectiveOverlayZIndexContext.Provider>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
)
