/**
 * Resolved-style parity and behavior pins for the Tamagui-free Popover web leg
 * (INFRA-3318), plus the native leg's floating-overlay contract (rendered against a
 * recording mock of the mycelium primitive).
 *
 * The style fixtures below are the legacy Tamagui popover's resolved output (main @
 * 92de6e3e — `@tamagui/popover` 1.136.1 + `@tamagui/popper` `PopperContentFrame`):
 * the styled content-frame defaults (`$background` / padding `space.true` 8 /
 * radius `radius.true` 0 / centered), the `getSpace(size, { shift: -2 })` arrow
 * size algebra, the `offset ?? arrowSize` fallback, the placement/offset/hoverable
 * mappers, and the z-index stacking bridge. Layout values are hard-pinned literals.
 *
 * One-shot migration gate, not a permanent invariant: delete this suite once the
 * INFRA-3285 rebuild lane retires the Tamagui baseline.
 */
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { act, cleanup, fireEvent, render, type RenderResult, screen } from '@testing-library/react'
import { OVERLAY_PORTAL_CONTAINER_ATTRIBUTE } from '@universe/mycelium/popover-compat'
import { type ReactNode, useContext } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

// expo-blur is a transitive dep reached through the AdaptiveWebModal import chain and ships
// JSX in a `.js` file that Vite refuses to parse (same workaround as Tooltip.parity.web.test.tsx).
vi.mock('expo-blur', () => ({
  BlurView: () => null,
}))

// Recording mock of the mycelium floating-overlay primitive so the NATIVE leg's
// contract can be pinned from jsdom (the real `.native` leg needs a RN host; the
// `.web` resolution of the primitive is a deliberate throwing stub).
interface OverlayRecord {
  content: Record<string, unknown>
  arrows: Array<Record<string, unknown>>
}
const overlayRecords: OverlayRecord = { content: {}, arrows: [] }
vi.mock('@universe/mycelium/floating-overlay', async () => {
  const ReactActual = await import('react')
  const OpenContext = ReactActual.createContext<{ open: boolean; setOpen: (open: boolean) => void }>({
    open: false,
    setOpen: () => {},
  })
  return {
    FloatingOverlayRoot: ({
      open,
      onOpenChange,
      children,
    }: {
      open?: boolean
      onOpenChange?: (open: boolean) => void
      children?: ReactNode
    }) =>
      ReactActual.createElement(
        OpenContext.Provider,
        { value: { open: open ?? false, setOpen: (next: boolean) => onOpenChange?.(next) } },
        children,
      ),
    FloatingOverlayAnchor: ({ children }: { children?: ReactNode }) =>
      ReactActual.createElement('div', { 'data-testid': 'fo-anchor' }, children),
    FloatingOverlayContent: (props: Record<string, unknown> & { children?: ReactNode }) => {
      const { open, setOpen } = ReactActual.useContext(OpenContext)
      const { children, ...rest } = props
      overlayRecords.content = rest
      if (!open) {
        return null
      }
      return ReactActual.createElement(
        'div',
        { 'data-testid': 'fo-content' },
        ReactActual.createElement('button', {
          'data-testid': 'fo-backdrop',
          onClick: () => {
            ;(rest['onPressOutside'] as (() => void) | undefined)?.()
            setOpen(false)
          },
        }),
        children,
      )
    },
    FloatingOverlayArrow: (props: Record<string, unknown>) => {
      overlayRecords.arrows.push(props)
      return ReactActual.createElement('div', {
        'data-testid': 'fo-arrow',
        'data-color': String(props['color']),
        'data-size': String(props['size']),
      })
    },
    useFloatingOverlayState: () => ReactActual.useContext(OpenContext),
  }
})

import { EffectiveModalOrSheetZIndexContext } from 'ui/src/components/modal/AdaptiveWebModal'
import { AdaptiveWebPopoverContent } from 'ui/src/components/popover/AdaptiveWebPopoverContent'
import { Popover } from 'ui/src/components/popover/Popover'
import { Popover as PopoverNative } from 'ui/src/components/popover/Popover.native'
import {
  mapHoverableToDelays,
  mapOffsetToAnchorPosition,
  mapPlacementToAnchorPosition,
  resolveArrowSize,
  resolveCollisionPadding,
  resolveNativeViewportPadding,
} from 'ui/src/components/popover/shared'
import { colorsDark, colorsLight, zIndexes } from 'ui/src/theme'
import { logger } from 'utilities/src/logger/logger'

type ThemeName = 'light' | 'dark'
const THEMES: ThemeName[] = ['light', 'dark']
const PALETTE: Record<ThemeName, typeof colorsLight> = { light: colorsLight, dark: colorsDark }

const TRIGGER_SELECTOR = '[data-slot="ui-popover-trigger"]'
const POSITIONER_SELECTOR = '[data-slot="ui-popover-positioner"]'
const POPUP_SELECTOR = '[data-slot="ui-popover-popup"]'
const ARROW_SELECTOR = '[data-slot="ui-popover-arrow"]'
const ARROW_INNER_SELECTOR = '[data-slot="ui-popover-arrow-inner"]'

function renderThemed(theme: ThemeName, children: ReactNode): RenderResult {
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(theme)
  return render(children)
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  document.documentElement.classList.remove('light', 'dark')
  overlayRecords.content = {}
  overlayRecords.arrows = []
})

/** jsdom normalizes inline-style colors (hex → rgb) — round-trip expected values through the same CSSOM. */
function cssColor(value: string): string {
  const probe = document.createElement('div')
  probe.style.color = value
  return probe.style.color
}

function renderPopover({
  theme = 'light',
  rootProps = {},
  contentProps = {},
  triggerProps = {},
  arrowProps,
  hostZIndex,
}: {
  theme?: ThemeName
  rootProps?: Partial<React.ComponentProps<typeof Popover>>
  contentProps?: Partial<React.ComponentProps<typeof Popover.Content>>
  triggerProps?: Partial<React.ComponentProps<typeof Popover.Trigger>>
  arrowProps?: Partial<React.ComponentProps<typeof Popover.Arrow>>
  hostZIndex?: number
} = {}): RenderResult {
  const tree = (
    <Popover open={true} {...rootProps}>
      <Popover.Trigger {...triggerProps}>
        <span>trigger</span>
      </Popover.Trigger>
      <Popover.Content {...contentProps}>
        {arrowProps !== undefined ? <Popover.Arrow {...arrowProps} /> : null}
        <div data-testid="popover-content">content</div>
      </Popover.Content>
    </Popover>
  )
  return renderThemed(
    theme,
    hostZIndex === undefined ? (
      tree
    ) : (
      <EffectiveModalOrSheetZIndexContext.Provider value={hostZIndex}>
        {tree}
      </EffectiveModalOrSheetZIndexContext.Provider>
    ),
  )
}

/**
 * jsdom 20 has no PointerEvent, so testing-library's fireEvent falls back to the bare
 * Event constructor, which silently DROPS `pointerType` — a plain
 * `fireEvent.pointerDown(el, { pointerType })` reaches every handler as `undefined`.
 * Attach the field explicitly so Base UI's pointerType bookkeeping sees the real
 * device kind (same helper as Tooltip.parity.web.test.tsx).
 */
function firePointerEvent({
  target,
  type,
  pointerType,
}: {
  target: Element | Document
  type: 'pointerdown' | 'pointerup'
  pointerType: 'mouse' | 'touch'
}): void {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  fireEvent(target, event)
}

function popupStyle(): CSSStyleDeclaration {
  const popup = document.querySelector(POPUP_SELECTOR) as HTMLElement | null
  if (!popup) {
    throw new Error('popup not rendered')
  }
  return popup.style
}

describe('shared mappers — legacy popper coordinate/timing algebra', () => {
  it('placement defaults to bottom/center and splits side-align pairs', () => {
    expect(mapPlacementToAnchorPosition(undefined)).toEqual({ side: 'bottom', align: 'center' })
    expect(mapPlacementToAnchorPosition('top-start')).toEqual({ side: 'top', align: 'start' })
    expect(mapPlacementToAnchorPosition('bottom-end')).toEqual({ side: 'bottom', align: 'end' })
  })

  it('maps floating-ui offsets, pre-flipping the physical crossAxis for end alignment', () => {
    expect(mapOffsetToAnchorPosition({ offset: 8, align: 'center' })).toEqual({ sideOffset: 8, alignOffset: 0 })
    expect(mapOffsetToAnchorPosition({ offset: { mainAxis: 8, crossAxis: -4 }, align: 'center' })).toEqual({
      sideOffset: 8,
      alignOffset: -4,
    })
    expect(mapOffsetToAnchorPosition({ offset: { mainAxis: 10, crossAxis: 6 }, align: 'end' })).toEqual({
      sideOffset: 10,
      alignOffset: -6,
    })
  })

  it('falls back to the registered arrow size when offset is omitted (legacy `offset ?? arrowSize`)', () => {
    expect(mapOffsetToAnchorPosition({ offset: undefined, align: 'center', arrowSize: 8 })).toEqual({
      sideOffset: 8,
      alignOffset: 0,
    })
    expect(mapOffsetToAnchorPosition({ offset: undefined, align: 'center' })).toEqual({ sideOffset: 0, alignOffset: 0 })
  })

  it('maps the hoverable prop onto hover-open timing (restMs stands in for a zero open delay)', () => {
    expect(mapHoverableToDelays(undefined)).toEqual({ openOnHover: false, openDelayMs: 0, closeDelayMs: 0 })
    expect(mapHoverableToDelays(true)).toEqual({ openOnHover: true, openDelayMs: 0, closeDelayMs: 0 })
    // The NavBar Tabs pair.
    expect(mapHoverableToDelays({ delay: { open: 75, close: 150 }, restMs: 50, move: true })).toEqual({
      openOnHover: true,
      openDelayMs: 75,
      closeDelayMs: 150,
    })
    // The ExploreStatsSection pair (open delay 0 → restMs).
    expect(mapHoverableToDelays({ delay: { open: 200 }, restMs: 100 })).toEqual({
      openOnHover: true,
      openDelayMs: 200,
      closeDelayMs: 0,
    })
  })

  it('clamps edge-collided popovers with the legacy shift padding (0), never the Base UI 5px default', () => {
    // Legacy `stayInFrame` → floating-ui `shift({})`, default padding 0. Base UI's
    // Positioner defaults `collisionPadding` to 5, which rested clamped popovers
    // (the HelpModal pair) 5px further from the viewport edge than legacy — the
    // mapper must always emit an explicit value so that default never applies.
    expect(resolveCollisionPadding(undefined)).toBe(0)
    expect(resolveCollisionPadding(true)).toBe(0)
    expect(resolveCollisionPadding(false)).toBe(0)
    expect(resolveCollisionPadding({})).toBe(0)
    // The PortfolioHeader pair — explicit shift padding passes through.
    expect(resolveCollisionPadding({ padding: 10 })).toBe(10)
    // Per-side shift padding passes through untouched.
    expect(resolveCollisionPadding({ padding: { left: 4, top: 2 } })).toEqual({ left: 4, top: 2 })
  })

  it('lowers stayInFrame to the native single-number viewportPadding through the same mapper', () => {
    // One source of truth with the web mapper: uniform forms map directly; a
    // per-side object (no live consumer) lowers to its largest side because the
    // floating-overlay engine clamps every edge by one number.
    expect(resolveNativeViewportPadding(undefined)).toBe(0)
    expect(resolveNativeViewportPadding(true)).toBe(0)
    expect(resolveNativeViewportPadding(false)).toBe(0)
    expect(resolveNativeViewportPadding({})).toBe(0)
    expect(resolveNativeViewportPadding({ padding: 10 })).toBe(10)
    expect(resolveNativeViewportPadding({ padding: { left: 4, top: 2 } })).toBe(4)
  })

  it('steps arrow-size tokens two sizes down the space scale (legacy getSpace shift -2, bounds [2])', () => {
    // Bare <Popover.Arrow /> → third-smallest space token (2px) — the legacy near-invisible tip.
    // Legacy never routed unset through `$true` (`indexOf(undefined)` = -1 → bounds floor), so
    // this intentionally DIFFERS from the `$true` pin below; unifying them would resize every
    // live bare-arrow consumer.
    expect(resolveArrowSize(undefined)).toBe(2)
    // The CopyHelper/TransactionAssetList `size="$spacing12"` → 8px.
    expect(resolveArrowSize('$spacing12')).toBe(8)
    // `$true` steps one extra (stepTokenUpOrDown's duplicate-value case) → 8px, not 2px.
    expect(resolveArrowSize('$true')).toBe(8)
    // Numbers pass straight through.
    expect(resolveArrowSize(12)).toBe(12)
  })
})

describe('Popover.Content — legacy PopperContentFrame styled defaults', () => {
  for (const theme of THEMES) {
    it(`${theme}: $background surface, padding 8, radius 0, centered column`, () => {
      renderPopover({ theme })
      const style = popupStyle()
      expect(style['backgroundColor']).toBe(cssColor(PALETTE[theme].surface1))
      expect(style['paddingTop']).toBe('8px')
      expect(style.paddingBottom).toBe('8px')
      expect(style.paddingLeft).toBe('8px')
      expect(style.paddingRight).toBe('8px')
      // radius.true = borderRadii.none = 0 (jsdom keeps the unitless zero).
      expect(style['borderRadius']).toBe('0')
      expect(style['alignItems']).toBe('center')
      expect(style.flexDirection).toBe('column')
      expect(style.display).toBe('flex')
    })
  }

  it('resolves the CopyHelper call-site fragment over the defaults (tokens + alias folding + shadow)', () => {
    renderPopover({
      contentProps: {
        borderRadius: '$rounded12',
        borderWidth: '$spacing1',
        borderColor: '$surface3',
        backgroundColor: '$surface1',
        p: '$spacing8',
        shadowColor: '$shadowColor',
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
      },
    })
    const style = popupStyle()
    expect(style['borderRadius']).toBe('12px')
    expect(style['borderWidth']).toBe('1px')
    expect(style.borderStyle).toBe('solid')
    expect(style['borderColor']).toBe(cssColor(colorsLight.surface3))
    expect(style['backgroundColor']).toBe(cssColor(colorsLight.surface1))
    expect(style['paddingTop']).toBe('8px')
    expect(style.boxShadow).toContain('0px 6px 12px')
  })

  it('folds padding aliases in insertion order (`p: $none` zeroes all edges, `py` reopens vertical)', () => {
    renderPopover({ contentProps: { p: '$none', py: '$spacing8' } })
    const style = popupStyle()
    expect(style.paddingLeft).toBe('0px')
    expect(style.paddingRight).toBe('0px')
    expect(style['paddingTop']).toBe('8px')
    expect(style.paddingBottom).toBe('8px')
  })

  it('unwraps Tamagui-delivered var(--themeKey) colors and `{ val }` variables to live theme values', () => {
    renderPopover({
      contentProps: {
        backgroundColor: 'var(--surface2)',
        shadowColor: { val: colorsLight.surface3 },
        shadowRadius: 4,
      },
    })
    const style = popupStyle()
    expect(style['backgroundColor']).toBe(cssColor(colorsLight.surface2))
    expect(style.boxShadow).toContain(cssColor(colorsLight.surface3))
  })

  it('merges $platform-web verbatim, last', () => {
    renderPopover({ contentProps: { '$platform-web': { boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.5)' } } })
    expect(popupStyle().boxShadow).toBe('0px 1px 2px rgba(0, 0, 0, 0.5)')
  })

  it('drives enter/exit motion from enterStyle (translate/scale/opacity, transform+opacity transition only)', () => {
    renderPopover({
      contentProps: { enterStyle: { y: -10, opacity: 0 }, exitStyle: { scale: 0.95, opacity: 0 } },
    })
    // Mounted-open renders the resting state with the transition armed.
    const style = popupStyle()
    expect(style.transition).toContain('transform 150ms ease-out')
    expect(style.transition).toContain('opacity 150ms ease-out')
    expect(style.transition).not.toContain('all')
  })
})

describe('Popover — z-index stacking bridge', () => {
  it('floors at zIndexes.popover with no host overlay', () => {
    renderPopover()
    const positioner = document.querySelector(POSITIONER_SELECTOR) as HTMLElement
    expect(positioner.style.zIndex).toBe(String(zIndexes.popover))
  })

  it('re-enables pointer events on the open positioner (body may be pointer-locked by a modal)', () => {
    renderPopover()
    const positioner = document.querySelector(POSITIONER_SELECTOR) as HTMLElement
    expect(positioner.style.pointerEvents).toBe('auto')
  })

  it('renders one layer above a host that exceeds the floor and re-provides the bumped layer', () => {
    const hostZIndex = 100_010
    let providedZ: number | undefined
    function ReadZ(): null {
      providedZ = useContext(EffectiveModalOrSheetZIndexContext)
      return null
    }
    renderPopover({ hostZIndex, contentProps: { children: undefined } })
    cleanup()
    renderThemed(
      'light',
      <EffectiveModalOrSheetZIndexContext.Provider value={hostZIndex}>
        <Popover open>
          <Popover.Trigger>
            <span>t</span>
          </Popover.Trigger>
          <Popover.Content>
            <ReadZ />
          </Popover.Content>
        </Popover>
      </EffectiveModalOrSheetZIndexContext.Provider>,
    )
    const positioner = document.querySelector(POSITIONER_SELECTOR) as HTMLElement
    expect(positioner.style.zIndex).toBe(String(hostZIndex + 1))
    expect(providedZ).toBe(hostZIndex + 1)
  })

  it('resolves the `$default` zIndex token (PortfolioHeader escape hatch)', () => {
    renderPopover({ contentProps: { zIndex: '$default' } })
    const positioner = document.querySelector(POSITIONER_SELECTOR) as HTMLElement
    expect(positioner.style.zIndex).toBe(String(zIndexes.default))
  })
})

describe('Popover — open-state semantics (legacy fully-controlled contract)', () => {
  it('uncontrolled: trigger press toggles open and closed', () => {
    renderPopover({ rootProps: { open: undefined } })
    expect(screen.queryByTestId('popover-content')).toBeNull()
    const trigger = document.querySelector(TRIGGER_SELECTOR) as HTMLElement
    fireEvent.click(trigger)
    expect(screen.getByTestId('popover-content')).toBeTruthy()
    fireEvent.click(trigger)
    expect(screen.queryByTestId('popover-content')).toBeNull()
  })

  it('controlled: requests close through onOpenChange on Escape without self-closing', () => {
    const onOpenChange = vi.fn()
    renderPopover({ rootProps: { open: true, onOpenChange } })
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false)
    expect(screen.getByTestId('popover-content')).toBeTruthy()
  })

  it('onEscapeKeyDown preventDefault swallows the close request (legacy Dismissable contract)', () => {
    const onOpenChange = vi.fn()
    renderPopover({
      rootProps: { open: true, onOpenChange },
      contentProps: { onEscapeKeyDown: (event) => event.preventDefault() },
    })
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('imperative close is never swallowed by dismiss interceptors (legacy Dismissable scope: escape/outside/focus only)', () => {
    const onOpenChange = vi.fn()
    const handle = { current: null as Popover | null }
    renderThemed(
      'light',
      <Popover ref={handle} defaultOpen onOpenChange={onOpenChange}>
        <Popover.Trigger>
          <span>t</span>
        </Popover.Trigger>
        <Popover.Content
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          onFocusOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <div data-testid="popover-content">content</div>
        </Popover.Content>
      </Popover>,
    )
    expect(screen.getByTestId('popover-content')).toBeTruthy()
    act(() => handle.current?.close())
    expect(screen.queryByTestId('popover-content')).toBeNull()
    expect(onOpenChange).toHaveBeenCalledWith(false, undefined)
  })

  it('hover-open still works after a click-upgraded open is closed imperatively (INFRA-3794)', () => {
    vi.useFakeTimers()
    try {
      const handle = { current: null as Popover | null }
      renderThemed(
        'light',
        <Popover ref={handle} hoverable={{ delay: { open: 75, close: 150 }, restMs: 50, move: true }}>
          <Popover.Trigger>
            <span>t</span>
          </Popover.Trigger>
          <Popover.Content>
            <div data-testid="popover-content">content</div>
          </Popover.Content>
        </Popover>,
      )
      const trigger = document.querySelector(TRIGGER_SELECTOR) as HTMLElement

      const hoverOpen = (): void => {
        fireEvent.mouseEnter(trigger)
        fireEvent.mouseMove(trigger)
        act(() => {
          vi.advanceTimersByTime(100)
        })
      }

      hoverOpen()
      expect(screen.getByTestId('popover-content')).toBeTruthy()

      // A click inside Base UI's 500ms stickIfOpen window keeps the popover open and
      // upgrades its recorded open event to the click (the nav-tab "impatient click").
      fireEvent.click(trigger)
      expect(screen.getByTestId('popover-content')).toBeTruthy()

      // The imperative close (nav tabs close on route change) must reset Base UI's
      // recorded open event — a bare controlled-prop flip leaves it click-like, which
      // suppresses hover-open on this instance until a full page reload.
      act(() => handle.current?.close())
      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(screen.queryByTestId('popover-content')).toBeNull()

      hoverOpen()
      expect(screen.getByTestId('popover-content')).toBeTruthy()
    } finally {
      vi.useRealTimers()
    }
  })

  it('exposes the legacy imperative handle through the root ref', () => {
    const handle = { current: null as Popover | null }
    renderThemed(
      'light',
      <Popover ref={handle}>
        <Popover.Trigger>
          <span>t</span>
        </Popover.Trigger>
        <Popover.Content>
          <div data-testid="popover-content">content</div>
        </Popover.Content>
      </Popover>,
    )
    expect(handle.current).toBeTruthy()
    expect(typeof handle.current?.open).toBe('function')
    expect(typeof handle.current?.close).toBe('function')
    expect(typeof handle.current?.toggle).toBe('function')
    expect(typeof handle.current?.setOpen).toBe('function')
    expect(typeof handle.current?.anchorTo).toBe('function')
  })
})

describe('Popover — focus trap parity (legacy trapFocus ?? open)', () => {
  const SENTINEL_SELECTOR = '[data-slot="ui-popover-close-sentinel"]'

  function renderWithOutsideButton(contentProps: Partial<React.ComponentProps<typeof Popover.Content>> = {}): void {
    renderThemed(
      'light',
      <>
        <button type="button" data-testid="outside-button">
          outside
        </button>
        <Popover open>
          <Popover.Trigger>
            <span>t</span>
          </Popover.Trigger>
          <Popover.Content {...contentProps}>
            <div data-testid="popover-content">content</div>
          </Popover.Content>
        </Popover>
      </>,
    )
  }

  it('registers a hidden close part so Base UI arms the trap for close-less consumers, never a tab stop', () => {
    // Base UI 1.6 arms its focus trap only when `modal !== false` AND a
    // `Popover.Close` part has registered (`hasClosePart` in PopoverPopup) — without
    // this sentinel, `modal="trap-focus"` is inert for every consumer that renders
    // no Close child (all live web popovers).
    renderPopover()
    const sentinel = document.querySelector(SENTINEL_SELECTOR) as HTMLElement
    expect(sentinel).toBeTruthy()
    expect(sentinel.style.display).toBe('none')
    expect(sentinel.tabIndex).toBe(-1)
    expect(sentinel.getAttribute('aria-hidden')).toBe('true')
  })

  it('traps while open: outside content is aria-hidden and Tab cannot escape the popup', () => {
    renderWithOutsideButton()
    // FloatingFocusManager only aria-hides the rest of the page when its `modal`
    // trap is armed (markOthers ariaHidden: modal) — the legacy trap-on-open pin.
    const outside = screen.getByTestId('outside-button')
    expect(outside.closest('[aria-hidden="true"]')).toBeTruthy()
    // With no tabbable content (the sentinel must not count), the armed trap stops
    // Tab at the document so focus cannot escape the popup.
    const popup = document.querySelector(POPUP_SELECTOR) as HTMLElement
    popup.focus()
    expect(document.activeElement).toBe(popup)
    const tabNotPrevented = fireEvent.keyDown(popup, { key: 'Tab' })
    expect(tabNotPrevented).toBe(false)
  })

  it('trapFocus={false} keeps the legacy opt-out: no aria-hiding, Tab escapes', () => {
    renderWithOutsideButton({ trapFocus: false })
    const outside = screen.getByTestId('outside-button')
    expect(outside.closest('[aria-hidden="true"]')).toBeNull()
    const popup = document.querySelector(POPUP_SELECTOR) as HTMLElement
    popup.focus()
    const tabNotPrevented = fireEvent.keyDown(popup, { key: 'Tab' })
    expect(tabNotPrevented).toBe(true)
  })
})

describe('Popover.Content — portal containment inside a focus-trapping host (SWAP-3351)', () => {
  /** The invariant is which marked host encloses the node, not Base UI's portal wrapper depth. */
  function markedHostOf(node: HTMLElement): HTMLElement | null {
    return node.closest<HTMLElement>(`[${OVERLAY_PORTAL_CONTAINER_ATTRIBUTE}]`)
  }

  function preventEvent(event: Event): void {
    event.preventDefault()
  }

  // The AdaptiveWebModal shape: a Radix modal Dialog whose content carries the portal
  // marker. `markContainer: false` is every other host — the popup must keep the plain
  // document.body portal there.
  function renderInDialog({
    markContainer,
    asChild = false,
    anchorOnly = false,
  }: {
    markContainer: boolean
    asChild?: boolean
    anchorOnly?: boolean
  }): void {
    renderThemed(
      'light',
      <>
        <DialogPrimitive.Root modal open>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Content
              aria-describedby={undefined}
              data-testid="dialog-content"
              onFocusOutside={preventEvent}
              onPointerDownOutside={preventEvent}
              {...(markContainer ? { [OVERLAY_PORTAL_CONTAINER_ATTRIBUTE]: '' } : undefined)}
            >
              <DialogPrimitive.Title>Review swap</DialogPrimitive.Title>
              <Popover open placement="bottom-end">
                {anchorOnly ? (
                  <Popover.Anchor>
                    <span>edit</span>
                  </Popover.Anchor>
                ) : (
                  <Popover.Trigger asChild={asChild}>
                    <span>edit</span>
                  </Popover.Trigger>
                )}
                <Popover.Content>
                  <input aria-label="Max slippage" />
                </Popover.Content>
              </Popover>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
        <input aria-label="outside probe" />
      </>,
    )
  }

  // jsdom dispatches focusin during focus(), which the dialog trap listens for: seed its
  // last-focused element, then confirm it pulls an outside focus back, so the popup focus
  // assertion below cannot pass vacuously.
  function proveDialogTrapEngaged(seed: HTMLElement): void {
    seed.focus()
    screen.getByLabelText('outside probe').focus()
    expect(document.activeElement).toBe(seed)
  }

  it('portals into the host-marked container so an input inside the popup can hold focus', () => {
    renderInDialog({ markContainer: true })
    proveDialogTrapEngaged(document.querySelector(TRIGGER_SELECTOR) as HTMLElement)

    const dialogContent = screen.getByTestId('dialog-content')
    const positioner = document.querySelector(POSITIONER_SELECTOR) as HTMLElement
    expect(markedHostOf(positioner)).toBe(dialogContent)

    const input = screen.getByLabelText<HTMLInputElement>('Max slippage')
    expect(input.closest(`[${OVERLAY_PORTAL_CONTAINER_ATTRIBUTE}]`)).toBe(dialogContent)
    expect(dialogContent.contains(input)).toBe(true)

    input.focus()
    expect(document.activeElement).toBe(input)
  })

  // The slippage call site is `<Popover.Trigger asChild>`, where the trigger node reaches the
  // root through cloneElement rather than the wrapper div.
  it('resolves the container from an asChild trigger too', () => {
    renderInDialog({ markContainer: true, asChild: true })
    const input = screen.getByLabelText<HTMLInputElement>('Max slippage')
    expect(input.closest(`[${OVERLAY_PORTAL_CONTAINER_ATTRIBUTE}]`)).toBe(screen.getByTestId('dialog-content'))
  })

  it('positions fixed when contained so the popup escapes the host content box overflow', () => {
    renderInDialog({ markContainer: true })
    const positioner = document.querySelector(POSITIONER_SELECTOR) as HTMLElement
    expect(positioner.style.position).toBe('fixed')
  })

  it('keeps the document.body portal and the default position method for an unmarked host', () => {
    renderInDialog({ markContainer: false })

    const positioner = document.querySelector(POSITIONER_SELECTOR) as HTMLElement
    expect(markedHostOf(positioner)).toBeNull()
    expect(document.body.contains(positioner)).toBe(true)
    expect(screen.getByTestId('dialog-content').contains(positioner)).toBe(false)
    expect(positioner.style.position).toBe('absolute')
  })

  it('keeps the document.body portal with no marked ancestor at all', () => {
    renderPopover()
    const positioner = document.querySelector(POSITIONER_SELECTOR) as HTMLElement
    expect(markedHostOf(positioner)).toBeNull()
    expect(document.body.contains(positioner)).toBe(true)
  })

  // SendRecipientForm anchors with `Popover.Anchor` and renders no `Popover.Trigger`, so
  // containment cannot resolve from the trigger alone.
  it('resolves the container from the anchor when the tree has no trigger', () => {
    renderInDialog({ markContainer: true, anchorOnly: true })
    const dialogContent = screen.getByTestId('dialog-content')
    proveDialogTrapEngaged(dialogContent)
    expect(document.querySelector(TRIGGER_SELECTOR)).toBeNull()

    const positioner = document.querySelector(POSITIONER_SELECTOR) as HTMLElement
    expect(markedHostOf(positioner)).toBe(dialogContent)
    expect(positioner.style.position).toBe('fixed')

    const input = screen.getByLabelText<HTMLInputElement>('Max slippage')
    input.focus()
    expect(document.activeElement).toBe(input)
  })
})

describe('Popover.Trigger / Popover.Close — wrapper contracts', () => {
  it('renders a plain div wrapper carrying data-testid and resolved style props', () => {
    renderPopover({ triggerProps: { 'data-testid': 'my-trigger', p: '$spacing8' } })
    const trigger = document.querySelector(TRIGGER_SELECTOR) as HTMLElement
    expect(trigger.tagName).toBe('DIV')
    expect(trigger.getAttribute('data-testid')).toBe('my-trigger')
    expect(trigger.style['paddingTop']).toBe('8px')
  })

  it('defaults the wrapper to a focusable button and lets role/tabIndex replace that', () => {
    renderPopover()
    const defaultTrigger = document.querySelector(TRIGGER_SELECTOR) as HTMLElement
    expect(defaultTrigger.getAttribute('role')).toBe('button')
    expect(defaultTrigger.tabIndex).toBe(0)
    cleanup()

    renderPopover({ triggerProps: { role: 'none', tabIndex: -1 } })
    const trigger = document.querySelector(TRIGGER_SELECTOR) as HTMLElement
    expect(trigger.getAttribute('role')).toBe('none')
    expect(trigger.tabIndex).toBe(-1)
  })

  it('asChild clones the child as the trigger, composing its onClick', () => {
    const childClick = vi.fn()
    renderThemed(
      'light',
      <Popover>
        <Popover.Trigger asChild>
          <button type="button" data-testid="as-child-trigger" onClick={childClick}>
            open
          </button>
        </Popover.Trigger>
        <Popover.Content>
          <div data-testid="popover-content">content</div>
        </Popover.Content>
      </Popover>,
    )
    const child = screen.getByTestId('as-child-trigger')
    fireEvent.click(child)
    expect(childClick).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('popover-content')).toBeTruthy()
  })

  it('Close requests close on press and composes asChild onClick', () => {
    const onOpenChange = vi.fn()
    const childClick = vi.fn()
    renderThemed(
      'light',
      <Popover open onOpenChange={onOpenChange}>
        <Popover.Trigger>
          <span>t</span>
        </Popover.Trigger>
        <Popover.Content>
          <Popover.Close asChild>
            <button type="button" data-testid="close-btn" onClick={childClick}>
              close
            </button>
          </Popover.Close>
        </Popover.Content>
      </Popover>,
    )
    fireEvent.click(screen.getByTestId('close-btn'))
    expect(childClick).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false, 'press')
  })
})

describe('Popover.Arrow — legacy rotated-square geometry', () => {
  it('CopyHelper fragment: $spacing12 token → 8px square, 1px border on the outer edges', () => {
    renderPopover({
      arrowProps: {
        size: '$spacing12',
        backgroundColor: colorsLight.surface1,
        borderWidth: '$spacing1',
        borderColor: colorsLight.surface3,
      },
    })
    const outer = document.querySelector(ARROW_SELECTOR) as HTMLElement
    const inner = document.querySelector(ARROW_INNER_SELECTOR) as HTMLElement
    expect(outer.style.overflow).toBe('hidden')
    expect(outer.style.pointerEvents).toBe('none')
    // side=bottom (default placement): window 2×size wide, size+border deep, shifted -size.
    expect(outer.style.width).toBe('16px')
    expect(outer.style.height).toBe('9px')
    expect(outer.style.top).toBe('-8px')
    expect(inner.style.width).toBe('8px')
    expect(inner.style.height).toBe('8px')
    expect(inner.style.transform).toBe('rotate(45deg)')
    expect(inner.style['backgroundColor']).toBe(cssColor(colorsLight.surface1))
    expect(inner.style['borderColor']).toBe(cssColor(colorsLight.surface3))
    expect(inner.style.borderTopWidth).toBe('1px')
    expect(inner.style.borderLeftWidth).toBe('1px')
    expect(inner.style.borderBottomWidth).toBe('0px')
  })

  it('bare <Popover.Arrow /> renders the legacy 2px default tip with theme colors', () => {
    renderPopover({ arrowProps: {} })
    const inner = document.querySelector(ARROW_INNER_SELECTOR) as HTMLElement
    expect(inner.style.width).toBe('2px')
    expect(inner.style['backgroundColor']).toBe(cssColor(colorsLight.surface1))
  })
})

describe('Popover.Adapt — sheet displacement (web)', () => {
  function renderAdapt(when: boolean): RenderResult {
    return renderThemed(
      'light',
      <Popover open>
        <Popover.Trigger>
          <span>t</span>
        </Popover.Trigger>
        <Popover.Content>
          <Popover.Arrow />
          <div data-testid="popover-content">content</div>
        </Popover.Content>
        <Popover.Adapt when={when}>
          <div data-testid="sheet-template">
            <Popover.Adapt.Contents />
          </div>
        </Popover.Adapt>
      </Popover>,
    )
  }

  it('inactive: content floats in the positioner, template unmounted', () => {
    renderAdapt(false)
    expect(document.querySelector(POSITIONER_SELECTOR)).toBeTruthy()
    expect(screen.queryByTestId('sheet-template')).toBeNull()
  })

  it('active: content teleports into Adapt.Contents, no positioner, arrow renders null', () => {
    renderAdapt(true)
    expect(document.querySelector(POSITIONER_SELECTOR)).toBeNull()
    const template = screen.getByTestId('sheet-template')
    expect(template.contains(screen.getByTestId('popover-content'))).toBe(true)
    expect(document.querySelector(ARROW_SELECTOR)).toBeNull()
  })

  // Dismissal while adapted: Base UI mounts no Popup in the adapted path, so it
  // classifies presses on the teleported content itself as outside presses — the
  // root swallows exactly those. Overlay/outside presses and Escape dismiss
  // normally (sheet convention).
  function renderAdaptDismiss(when: boolean, onOpenChange: (open: boolean) => void): RenderResult {
    return renderThemed(
      'light',
      <Popover open onOpenChange={onOpenChange}>
        <Popover.Trigger>
          <span>t</span>
        </Popover.Trigger>
        <Popover.Content>
          <div data-testid="popover-content">
            <button type="button" data-testid="inside-button">
              inside
            </button>
          </div>
        </Popover.Content>
        <Popover.Adapt when={when}>
          <div data-testid="sheet-template">
            <Popover.Adapt.Contents />
          </div>
        </Popover.Adapt>
      </Popover>,
    )
  }

  /**
   * A real mobile tap: touchstart/touchend then the compatibility mousedown/click.
   * Base UI's touch path skips `pointerdown` with `pointerType: 'touch'` entirely
   * (`handlePointerDown` in useDismiss) — a stationary tap dismisses through the
   * compat `mousedown`, so a pointer-events-only simulation never exercises it.
   */
  function fireTouchTap(target: Element): void {
    fireEvent.touchStart(target, { touches: [{ clientX: 10, clientY: 10 }] })
    fireEvent.touchEnd(target, { changedTouches: [{ clientX: 10, clientY: 10 }] })
    fireEvent.mouseDown(target)
    fireEvent.mouseUp(target)
    fireEvent.click(target)
  }

  it('adapted: tap inside the teleported content does not request a close', () => {
    const onOpenChange = vi.fn()
    renderAdaptDismiss(true, onOpenChange)
    fireTouchTap(screen.getByTestId('inside-button'))
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('adapted: outside/overlay tap still requests a close', () => {
    const onOpenChange = vi.fn()
    renderAdaptDismiss(true, onOpenChange)
    fireTouchTap(document.body)
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false)
  })

  it('adapted: Escape still requests a close', () => {
    const onOpenChange = vi.fn()
    renderAdaptDismiss(true, onOpenChange)
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false)
  })

  it('not adapted: outside press still requests a close through onOpenChange', () => {
    const onOpenChange = vi.fn()
    renderAdaptDismiss(false, onOpenChange)
    firePointerEvent({ target: document.body, type: 'pointerdown', pointerType: 'mouse' })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false)
  })
})

describe('AdaptiveWebPopoverContent — placement-driven presence styles + stacking', () => {
  it('renders the floating content with the popover z-index floor when not adapting', () => {
    renderThemed(
      'light',
      <Popover open placement="bottom-end">
        <Popover.Trigger>
          <span>t</span>
        </Popover.Trigger>
        <AdaptiveWebPopoverContent isOpen adaptWhen={false} backgroundColor="$surface1">
          <div data-testid="adaptive-content">content</div>
        </AdaptiveWebPopoverContent>
      </Popover>,
    )
    expect(screen.getByTestId('adaptive-content')).toBeTruthy()
    const positioner = document.querySelector(POSITIONER_SELECTOR) as HTMLElement
    expect(positioner.style.zIndex).toBe(String(zIndexes.popover))
    expect(popupStyle().backgroundColor).toBe(cssColor(colorsLight.surface1))
  })
})

describe('native leg — floating-overlay contract (recorded through the primitive mock)', () => {
  function renderNative({
    rootProps = {},
    contentProps = {},
    arrowProps,
  }: {
    rootProps?: Partial<React.ComponentProps<typeof PopoverNative>>
    contentProps?: Partial<React.ComponentProps<typeof PopoverNative.Content>>
    arrowProps?: Partial<React.ComponentProps<typeof PopoverNative.Arrow>>
  } = {}): RenderResult {
    return renderThemed(
      'light',
      <PopoverNative open {...rootProps}>
        <PopoverNative.Trigger>
          <span>t</span>
        </PopoverNative.Trigger>
        <PopoverNative.Content {...contentProps}>
          {arrowProps !== undefined ? <PopoverNative.Arrow {...arrowProps} /> : null}
          <div data-testid="native-content">content</div>
        </PopoverNative.Content>
      </PopoverNative>,
    )
  }

  it('passes the legacy positioning contract to the primitive (placement, offset, flip OFF by default)', () => {
    renderNative({ rootProps: { placement: 'top-end', offset: 12 } })
    expect(overlayRecords.content['placement']).toBe('top-end')
    expect(overlayRecords.content['offset']).toBe(12)
    expect(overlayRecords.content['flip']).toBe(false)
    expect(overlayRecords.content['dismissOnPressOutside']).toBe(true)
    expect(overlayRecords.content['dismissOnBackPress']).toBe(true)
    expect(overlayRecords.content['zIndex']).toBe(zIndexes.popover)
  })

  /**
   * The frame styles must land on the element that DIRECTLY PARENTS the popover
   * children (the legacy `PopperContentFrame` contract) — one level up, on the
   * primitive's positioned wrapper, child-layout styles like `gap` are inert.
   * Regression pin for the INFRA-3318 device diff: AccountSelectPopover's
   * `gap="$gap20"` measured 20dp of lost row spacing when the gap rode the wrapper.
   */
  function nativeFrame(): HTMLElement {
    const frame = screen.getByTestId('ui-popover-native-frame')
    expect(frame.contains(screen.getByTestId('native-content'))).toBe(true)
    return frame
  }

  it('resolves the AccountSelectPopover style fragment onto the child-parenting frame (defaults + tokens)', () => {
    renderNative({
      contentProps: {
        borderRadius: '$rounded20',
        borderWidth: '$spacing1',
        borderColor: '$surface3',
        backgroundColor: '$surface1',
        p: '$spacing16',
        gap: '$gap20',
      },
    })
    const style = nativeFrame().style
    expect(style.backgroundColor).toBe(cssColor(colorsLight.surface1))
    // react-native-web expands the RN border/radius shorthands to longhands (and
    // serializes rgba without spaces — compare whitespace-insensitively).
    expect(style.borderTopColor.replaceAll(' ', '')).toBe(cssColor(colorsLight.surface3).replaceAll(' ', ''))
    expect(style.borderTopLeftRadius).toBe('20px')
    expect(style.borderTopWidth).toBe('1px')
    expect(style.paddingTop).toBe('16px')
    expect(style.alignItems).toBe('center')
    // The device-diff regression pin: gap applies where the children are parented.
    expect([style.gap, style.rowGap]).toContain('20px')
  })

  it('keeps the legacy frame defaults on the child-parenting frame ($background, padding 8, radius 0)', () => {
    renderNative()
    const style = nativeFrame().style
    expect(style.backgroundColor).toBe(cssColor(colorsLight.surface1))
    expect(style.paddingTop).toBe('8px')
    expect(style.borderTopLeftRadius).toBe('0px')
    // The primitive's positioned wrapper carries no frame styles at all.
    expect(overlayRecords.content['style']).toBeUndefined()
  })

  it('hoists the arrow out of the padded frame onto the positioned wrapper (CopyToClipboard device-diff pin)', () => {
    // FloatingOverlayArrow computes absolute insets against the primitive's
    // positioned wrapper, but Yoga resolves them against the parent's CONTENT box —
    // rendered inside the padded/bordered ContentFrame, the triangle lands
    // border+padding lower/right, INSIDE the bubble instead of protruding from its
    // edge (the arrow regression in the executed device diff).
    renderNative({
      arrowProps: { size: '$spacing12', borderWidth: '$spacing1', borderColor: colorsLight.surface3 },
    })
    const frame = screen.getByTestId('ui-popover-native-frame')
    const content = screen.getByTestId('fo-content')
    const arrows = screen.getAllByTestId('fo-arrow')
    expect(arrows.length).toBeGreaterThanOrEqual(2)
    for (const arrow of arrows) {
      expect(content.contains(arrow)).toBe(true)
      expect(frame.contains(arrow)).toBe(false)
    }
  })

  it('lowers per-side stayInFrame padding onto the primitive viewportPadding (largest side)', () => {
    renderNative({ rootProps: { stayInFrame: { padding: { left: 4, top: 2 } } } })
    expect(overlayRecords.content['viewportPadding']).toBe(4)
  })

  it('forwards the Content ref to the child-parenting frame (legacy content-frame ref)', () => {
    const contentRef = { current: null as HTMLElement | null }
    renderThemed(
      'light',
      <PopoverNative open>
        <PopoverNative.Trigger>
          <span>t</span>
        </PopoverNative.Trigger>
        <PopoverNative.Content ref={contentRef as never}>
          <div data-testid="native-content">content</div>
        </PopoverNative.Content>
      </PopoverNative>,
    )
    expect(contentRef.current).toBe(screen.getByTestId('ui-popover-native-frame'))
  })

  it('fades the hoisted arrow with the bubble (shared zero-styled animated opacity parent)', () => {
    // Legacy rendered the arrow inside the Tamagui-animated PopperContent, so it
    // faded with the bubble. The 150ms mount fade rides a zero-styled wrapper at
    // the positioned wrapper's origin that parents BOTH the frame and the hoisted
    // arrows — shared fade without re-parenting the arrow into a padded box.
    renderNative({ arrowProps: { size: '$spacing12' } })
    const frame = screen.getByTestId('ui-popover-native-frame')
    const fade = screen.getByTestId('ui-popover-native-fade')
    expect(fade.contains(frame)).toBe(true)
    for (const arrow of screen.getAllByTestId('fo-arrow')) {
      expect(arrow.parentElement).toBe(fade)
    }
    // The fade wrapper is the Animated element (opacity binding lives on it, not
    // on the styled frame; already settled to 1 by assertion time in jsdom).
    expect(fade.style.opacity).not.toBe('')
    expect(frame.style.opacity).toBe('')
  })

  it('warns in dev when Popover.Arrow is nested away from the direct-child slot', () => {
    // Children.toArray does not enter fragments/wrapper components: a nested arrow
    // is NOT hoisted and falls back into the padded frame, where its absolute
    // insets are displaced by border+padding (the device-diff arrow regression).
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    renderThemed(
      'light',
      <PopoverNative open>
        <PopoverNative.Trigger>
          <span>t</span>
        </PopoverNative.Trigger>
        <PopoverNative.Content>
          <>
            <PopoverNative.Arrow />
          </>
          <div data-testid="native-content">content</div>
        </PopoverNative.Content>
      </PopoverNative>,
    )
    expect(warn).toHaveBeenCalledWith(
      'PopoverInternal.native.tsx',
      'PopoverArrow',
      expect.stringContaining('DIRECT child'),
    )
    warn.mockRestore()
  })

  it('layers a border triangle under the fill triangle for bordered arrows', () => {
    renderNative({
      arrowProps: {
        size: '$spacing12',
        backgroundColor: colorsLight.surface1,
        borderWidth: '$spacing1',
        borderColor: colorsLight.surface3,
      },
    })
    // The mock records every render pass (the arrow-size registration re-renders
    // the root once) — the final pass is the settled pair.
    const settled = overlayRecords.arrows.slice(-2)
    expect(settled[0]).toMatchObject({ color: colorsLight.surface3, size: 10 })
    expect(settled[1]).toMatchObject({ color: colorsLight.surface1, size: 8 })
  })

  it('backdrop press requests close through onOpenChange (legacy fullscreen dismiss)', () => {
    const onOpenChange = vi.fn()
    renderNative({ rootProps: { onOpenChange } })
    fireEvent.click(screen.getByTestId('fo-backdrop'))
    expect(onOpenChange).toHaveBeenCalledWith(false, 'press')
  })

  it('uncontrolled trigger press opens; Adapt is a render-nothing no-op', () => {
    renderThemed(
      'light',
      <PopoverNative>
        <PopoverNative.Trigger testID="native-trigger">
          <span>t</span>
        </PopoverNative.Trigger>
        <PopoverNative.Content>
          <div data-testid="native-content">content</div>
        </PopoverNative.Content>
        <PopoverNative.Adapt when={true}>
          <div data-testid="native-adapt-template" />
        </PopoverNative.Adapt>
      </PopoverNative>,
    )
    expect(screen.queryByTestId('native-content')).toBeNull()
    expect(screen.queryByTestId('native-adapt-template')).toBeNull()
    fireEvent.click(screen.getByTestId('native-trigger'))
    expect(screen.getByTestId('native-content')).toBeTruthy()
  })
})
