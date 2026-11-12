/**
 * Behavior pins for the TooltipCompat web leg, ported from the retired
 * `ui/src/components/tooltip` parity suite: the legacy popper vocabulary
 * mappers, controlled/uncontrolled open state, hover timing, `asChild`
 * composition, the overlay z-index bridge, click-through, arrow geometry and
 * colors, and the touch affordance (tap toggles, tap-away dismisses).
 */
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { act, cleanup, fireEvent, render, type RenderResult, screen } from '@testing-library/react'
import { type JSX, type ReactNode, useContext } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mapOffsetToAnchorPosition, mapPlacementToAnchorPosition } from '../popover-compat/position'
import { EffectiveOverlayZIndexContext, OVERLAY_Z_INDEXES } from '../popover-compat/z-index'
import { DARK_THEME_COLORS, LIGHT_THEME_COLORS } from '../theme-hooks-compat/tokens'
import {
  mapTooltipDelay,
  TOOLTIP_DEFAULT_DELAY,
  TOOLTIP_DEFAULT_OFFSET,
  TOOLTIP_DEFAULT_REST_MS,
  tooltipContentFrameClassName,
} from './compile'
import { TooltipCompat as Tooltip } from './TooltipCompat.web'

type ThemeName = 'light' | 'dark'

const TRIGGER_SELECTOR = '[data-slot="tooltip-compat-trigger"]'
const POSITIONER_SELECTOR = '[data-slot="tooltip-compat-positioner"]'
const POPUP_SELECTOR = '[data-slot="tooltip-compat-popup"]'
const ARROW_SELECTOR = '[data-slot="tooltip-compat-arrow"]'
const ARROW_INNER_SELECTOR = '[data-slot="tooltip-compat-arrow-inner"]'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  document.documentElement.classList.remove('light', 'dark')
})

describe('shared mappers — the legacy popper vocabulary onto the positioner', () => {
  it('maps the legacy styled defaults (delay {close: 500, open: 0} + restMs 200 → open 200 / close 500)', () => {
    expect(TOOLTIP_DEFAULT_OFFSET).toEqual({ mainAxis: 16 })
    expect(mapTooltipDelay({ delay: TOOLTIP_DEFAULT_DELAY, restMs: TOOLTIP_DEFAULT_REST_MS })).toEqual({
      openDelayMs: 200,
      closeDelayMs: 500,
    })
  })

  it('a nonzero open delay wins over restMs; a numeric delay applies to both edges', () => {
    expect(mapTooltipDelay({ delay: { open: 300, close: 50 }, restMs: 200 })).toEqual({
      openDelayMs: 300,
      closeDelayMs: 50,
    })
    expect(mapTooltipDelay({ delay: 250, restMs: 200 })).toEqual({ openDelayMs: 250, closeDelayMs: 250 })
  })

  it('placement defaults to bottom-center and splits side-align pairs', () => {
    expect(mapPlacementToAnchorPosition(undefined)).toEqual({ side: 'bottom', align: 'center' })
    expect(mapPlacementToAnchorPosition('top-end')).toEqual({ side: 'top', align: 'end' })
    expect(mapPlacementToAnchorPosition('left')).toEqual({ side: 'left', align: 'center' })
  })

  it('offset maps mainAxis → sideOffset and pre-flips crossAxis for end alignment (physical offset parity)', () => {
    expect(mapOffsetToAnchorPosition({ offset: TOOLTIP_DEFAULT_OFFSET, align: 'center' })).toEqual({
      sideOffset: 16,
      alignOffset: 0,
    })
    expect(mapOffsetToAnchorPosition({ offset: { mainAxis: 8, crossAxis: -4 }, align: 'end' })).toEqual({
      sideOffset: 8,
      alignOffset: 4,
    })
    expect(mapOffsetToAnchorPosition({ offset: 10, align: 'start' })).toEqual({ sideOffset: 10, alignOffset: 0 })
  })
})

describe('TooltipCompat — controlled open state (legacy TooltipBase semantics)', () => {
  it('renders nothing while closed and the portal content while open', () => {
    renderTooltip({ rootProps: { open: false } })
    expect(screen.queryByTestId('tooltip-content')).toBeNull()
    cleanup()
    renderTooltip({ rootProps: { open: true } })
    expect(screen.getByTestId('tooltip-content')).toBeTruthy()
  })

  it('requests close through onOpenChange on Escape without self-closing (stays controlled)', () => {
    const onOpenChange = vi.fn()
    renderTooltip({ rootProps: { open: true, onOpenChange } })
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false)
    expect(screen.getByTestId('tooltip-content')).toBeTruthy()
  })
})

describe('TooltipCompat — uncontrolled hover timing (legacy delay/restMs defaults)', () => {
  it('opens after the mapped open delay on hover (defaults: restMs 200), not before', () => {
    vi.useFakeTimers()
    renderTooltip()
    hover(getTrigger())
    advance(100)
    expect(screen.queryByTestId('tooltip-content')).toBeNull()
    advance(150)
    expect(screen.getByTestId('tooltip-content')).toBeTruthy()
  })

  it('closes after the mapped close delay on hover-out (defaults: 500ms)', () => {
    vi.useFakeTimers()
    renderTooltip()
    const trigger = getTrigger()
    hover(trigger)
    advance(250)
    expect(screen.getByTestId('tooltip-content')).toBeTruthy()
    fireEvent.mouseLeave(trigger)
    advance(300)
    expect(screen.getByTestId('tooltip-content')).toBeTruthy()
    advance(300)
    expect(screen.queryByTestId('tooltip-content')).toBeNull()
  })

  it('honors a call-site delay pair (the InfoTooltip timings: open restMs 20, close 100)', () => {
    vi.useFakeTimers()
    renderTooltip({ rootProps: { delay: { close: 100, open: 0 }, restMs: 20 } })
    const trigger = getTrigger()
    hover(trigger)
    advance(30)
    expect(screen.getByTestId('tooltip-content')).toBeTruthy()
    fireEvent.mouseLeave(trigger)
    advance(150)
    expect(screen.queryByTestId('tooltip-content')).toBeNull()
  })

  it('clicking the trigger does not close a hover-opened tooltip (legacy hover engine had no click-close)', () => {
    vi.useFakeTimers()
    renderTooltip()
    const trigger = getTrigger()
    hover(trigger)
    advance(250)
    expect(screen.getByTestId('tooltip-content')).toBeTruthy()
    firePointerEvent({ target: trigger, type: 'pointerdown', pointerType: 'mouse' })
    fireEvent.click(trigger)
    expect(screen.getByTestId('tooltip-content')).toBeTruthy()
  })
})

describe('TooltipCompat — touch affordance (Base UI hover is mouse-only)', () => {
  it('a non-mouse pointerdown followed by click opens the uncontrolled tooltip', () => {
    renderTooltip()
    tap(getTrigger())
    expect(screen.getByTestId('tooltip-content')).toBeTruthy()
  })

  it('a touch pointerdown without a click (a scroll gesture) does not open', () => {
    renderTooltip()
    firePointerEvent({ target: getTrigger(), type: 'pointerdown', pointerType: 'touch' })
    expect(screen.queryByTestId('tooltip-content')).toBeNull()
  })

  it('a mouse click does NOT open the tooltip — the mouse path is hover, behind the rest delay', () => {
    vi.useFakeTimers()
    renderTooltip()
    const trigger = getTrigger()
    firePointerEvent({ target: trigger, type: 'pointerdown', pointerType: 'mouse' })
    fireEvent.click(trigger)
    // Well past the mapped open delay — proves no delayed open armed either.
    advance(2000)
    expect(screen.queryByTestId('tooltip-content')).toBeNull()
  })

  it('a second tap on the open trigger closes it (toggle), emitting one transition each way', () => {
    const onOpenChange = vi.fn()
    renderTooltip({ rootProps: { onOpenChange } })
    const trigger = getTrigger()
    tap(trigger)
    expect(screen.getByTestId('tooltip-content')).toBeTruthy()
    tap(trigger)
    expect(screen.queryByTestId('tooltip-content')).toBeNull()
    expect(onOpenChange.mock.calls).toEqual([[true], [false]])
  })

  it('tapping outside closes a touch-opened tooltip', () => {
    renderTooltip()
    tap(getTrigger())
    expect(screen.getByTestId('tooltip-content')).toBeTruthy()
    firePointerEvent({ target: document.body, type: 'pointerdown', pointerType: 'touch' })
    expect(screen.queryByTestId('tooltip-content')).toBeNull()
  })

  it('a pointerdown inside the popup does not dismiss a touch-opened tooltip', () => {
    renderTooltip({ contentProps: { pointerEvents: 'auto' } })
    tap(getTrigger())
    firePointerEvent({ target: screen.getByTestId('tooltip-content'), type: 'pointerdown', pointerType: 'touch' })
    expect(screen.getByTestId('tooltip-content')).toBeTruthy()
  })

  // jsdom can't reproduce a device tap, so the UA's output is transcribed:
  // pointerleave fires as the finger lifts, then the compat mouse events.
  // None of it may arm a close on the touch-opened tooltip.
  it('the full event sequence a tap emits (pointerleave at finger lift + compat mouse events) arms no close', () => {
    vi.useFakeTimers()
    renderTooltip()
    const trigger = getTrigger()
    firePointerEvent({ target: trigger, type: 'pointerdown', pointerType: 'touch' })
    firePointerEvent({ target: trigger, type: 'pointerup', pointerType: 'touch' })
    firePointerEvent({ target: trigger, type: 'pointerleave', pointerType: 'touch' })
    fireEvent.mouseOver(trigger)
    fireEvent.mouseEnter(trigger)
    fireEvent.mouseMove(trigger)
    fireEvent.mouseDown(trigger)
    fireEvent.mouseUp(trigger)
    fireEvent.click(trigger)
    advance(2000)
    expect(screen.getByTestId('tooltip-content')).toBeTruthy()
  })

  it('a controlled tooltip only REQUESTS the touch open through onOpenChange', () => {
    const onOpenChange = vi.fn()
    renderTooltip({ rootProps: { open: false, onOpenChange } })
    tap(getTrigger())
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.queryByTestId('tooltip-content')).toBeNull()
  })

  it('a tap on an asChild trigger opens the tooltip, the child handlers running too', () => {
    const childOnPointerDown = vi.fn()
    const childOnClick = vi.fn()
    renderThemed(
      'light',
      <Tooltip>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            data-testid="as-child-trigger"
            onPointerDown={childOnPointerDown}
            onClick={childOnClick}
          >
            trigger
          </button>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <div data-testid="tooltip-content">tip</div>
        </Tooltip.Content>
      </Tooltip>,
    )
    tap(screen.getByTestId('as-child-trigger'))
    expect(screen.getByTestId('tooltip-content')).toBeTruthy()
    expect(childOnPointerDown).toHaveBeenCalledTimes(1)
    expect(childOnClick).toHaveBeenCalledTimes(1)
  })
})

describe('TooltipCompat.Trigger — legacy Tamagui stack contract', () => {
  it('renders a plain div wrapper (not a native button) carrying testID and its children', () => {
    renderTooltip({ triggerProps: { testID: 'trigger-wrapper' } })
    const trigger = getTrigger()
    expect(trigger.tagName).toBe('DIV')
    expect(trigger.getAttribute('data-testid')).toBe('trigger-wrapper')
    expect(trigger.textContent).toBe('trigger')
  })

  it('asChild renders the child element itself as the trigger, content preserved, handlers composed child-first', () => {
    const calls: string[] = []
    const childOnClick = vi.fn(() => calls.push('child'))
    const onPress = vi.fn(() => calls.push('onPress'))
    renderThemed(
      'light',
      <Tooltip open>
        <Tooltip.Trigger asChild onPress={onPress}>
          <button type="button" data-testid="as-child-trigger" className="child-class" onClick={childOnClick}>
            trigger
          </button>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <div data-testid="tooltip-content">tip</div>
        </Tooltip.Content>
      </Tooltip>,
    )
    const trigger = screen.getByTestId('as-child-trigger')
    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger.getAttribute('data-slot')).toBe('tooltip-compat-trigger')
    expect(document.querySelectorAll(TRIGGER_SELECTOR)).toHaveLength(1)
    expect(trigger.textContent).toBe('trigger')
    expect(trigger.classList.contains('child-class')).toBe(true)
    fireEvent.click(trigger)
    expect(calls).toEqual(['child', 'onPress'])
  })
})

describe('TooltipCompat.Content — stacking bridge (EffectiveOverlayZIndexContext)', () => {
  it('floors at the tooltip layer with no host, and re-provides the layer to children', () => {
    renderThemed(
      'light',
      <Tooltip open>
        <Tooltip.Trigger>
          <span>trigger</span>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <ZIndexProbe />
        </Tooltip.Content>
      </Tooltip>,
    )
    expect(getPositioner().style.zIndex).toBe(String(OVERLAY_Z_INDEXES.tooltip))
    expect(screen.getByTestId('z-probe').textContent).toBe(String(OVERLAY_Z_INDEXES.tooltip))
  })

  it('renders one layer above a hosting modal/sheet', () => {
    renderTooltip({ rootProps: { open: true }, hostZIndex: OVERLAY_Z_INDEXES.tooltip + 350 })
    expect(getPositioner().style.zIndex).toBe(String(OVERLAY_Z_INDEXES.tooltip + 351))
  })

  it('stays at its floor inside a lower host (a z-1060 modal)', () => {
    renderTooltip({ rootProps: { open: true }, hostZIndex: OVERLAY_Z_INDEXES.modal })
    expect(getPositioner().style.zIndex).toBe(String(OVERLAY_Z_INDEXES.tooltip))
  })

  it('the legacy zIndex escape hatch wins', () => {
    renderTooltip({ rootProps: { open: true }, contentProps: { zIndex: 4242 }, hostZIndex: 9000 })
    expect(getPositioner().style.zIndex).toBe('4242')
  })
})

describe('TooltipCompat.Content — nested inside a popover hosted by a modal', () => {
  // Base UI appends a nested portal into its parent overlay's portal. The settings popover's portal
  // is display:contents inside the modal's gapped flex column, so any boxed wrapper here becomes a
  // new flex item and the modal grows by one gap (and re-centers) every time the tooltip opens.
  it('opening the tooltip adds no in-flow box to the host column', () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.flexDirection = 'column'
    host.style.gap = '12px'
    document.body.appendChild(host)
    try {
      const view = render(<TooltipInHostedPopover host={host} tooltipOpen={false} />)
      const closedFlow = inFlowChildren(host)

      view.rerender(<TooltipInHostedPopover host={host} tooltipOpen />)
      const portalWrapper = getPositioner().parentElement as HTMLElement

      expect(screen.getByTestId('popover-popup').contains(portalWrapper)).toBe(false)
      expect(host.contains(portalWrapper)).toBe(true)
      expect(portalWrapper.style.display).toBe('contents')
      expect(inFlowChildren(host)).toEqual(closedFlow)
    } finally {
      cleanup()
      host.remove()
    }
  })
})

describe('TooltipCompat — click-through while open (legacy pointerEvents contract)', () => {
  // Base UI only inerts the positioner while closed; without the explicit
  // style an open tooltip swallows clicks aimed beneath its rect.
  it('the positioner and popup are pointer-inert while open', () => {
    renderTooltip({ rootProps: { open: true } })
    expect(getPositioner().style.pointerEvents).toBe('none')
    expect(getPopup().classList.contains('[pointer-events:none]')).toBe(true)
  })

  it('pointerEvents="auto" content re-enables the popup under the inert positioner', () => {
    renderTooltip({ rootProps: { open: true }, contentProps: { pointerEvents: 'auto' } })
    expect(getPositioner().style.pointerEvents).toBe('none')
    const popup = getPopup()
    expect(popup.classList.contains('[pointer-events:auto]')).toBe(true)
    expect(popup.classList.contains('[pointer-events:none]')).toBe(false)
  })
})

describe('TooltipCompat.Content — caller shadow vs the light-theme default', () => {
  // A `light:` class sorts after the caller's plain one at equal specificity, so
  // keeping the default would replace the caller's shadow in light mode.
  const DEFAULT_LIGHT_SHADOW = 'light:[box-shadow:'

  it('keeps the default light shadow when the caller passes none', () => {
    expect(tooltipContentFrameClassName({})).toContain(DEFAULT_LIGHT_SHADOW)
  })

  it('drops it for a web `$platform-web` boxShadow (Coachmark on the web app)', () => {
    const className = tooltipContentFrameClassName({ '$platform-web': { boxShadow: '0px 6px 12px -3px #1313130a' } })
    expect(className).not.toContain(DEFAULT_LIGHT_SHADOW)
  })

  it('drops it for RN shadow keys (Coachmark in the extension)', () => {
    const className = tooltipContentFrameClassName({
      shadowColor: '#1313130a',
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 12,
    })
    expect(className).not.toContain(DEFAULT_LIGHT_SHADOW)
  })
})

describe('TooltipCompat.Arrow — the legacy 12px rotated-square, two-element geometry', () => {
  it('renders the clip window and the rotated inner square on the popup side Base UI stamps (default bottom)', () => {
    renderTooltip({ rootProps: { open: true }, arrow: true })
    const arrowWindow = getElement(ARROW_SELECTOR)
    const inner = getElement(ARROW_INNER_SELECTOR)
    expect(arrowWindow.getAttribute('data-side')).toBe('bottom')
    expect(inner.parentElement).toBe(arrowWindow)
    // jsdom applies no Tailwind CSS: pin the side-keyed classes that produce the geometry.
    for (const className of [
      'overflow-hidden',
      'pointer-events-none',
      'data-[side=bottom]:top-[-12px]',
      'data-[side=bottom]:h-[13px]',
      'data-[side=bottom]:w-[24px]',
    ]) {
      expect(arrowWindow.classList.contains(className), className).toBe(true)
    }
    // Border only on the two OUTER edges for side 'bottom' (top/left before rotation).
    for (const className of [
      'rotate-45',
      'absolute',
      'in-data-[side=bottom]:top-[6px]',
      'in-data-[side=bottom]:left-[6px]',
      'in-data-[side=bottom]:border-t-[1px]',
      'in-data-[side=bottom]:border-l-[1px]',
    ]) {
      expect(inner.classList.contains(className), className).toBe(true)
    }
  })

  it('without color props the inner square carries no inline background/border color (theme classes paint it)', () => {
    renderTooltip({ rootProps: { open: true }, arrow: true })
    const inner = getElement(ARROW_INNER_SELECTOR)
    expect(inner.style.backgroundColor).toBe('')
    expect(inner.style.borderColor).toBe('')
  })
})

describe('TooltipCompat.Arrow — color overrides (the Coachmark inverse-theme path)', () => {
  it.each<ThemeName>(['light', 'dark'])('a $token resolves to the active %s theme value', (theme) => {
    const palette = theme === 'dark' ? DARK_THEME_COLORS : LIGHT_THEME_COLORS
    renderArrow({ theme, backgroundColor: '$surface1Contrast', borderColor: '$surface3' })
    const inner = getElement(ARROW_INNER_SELECTOR)
    expect(inner.style.backgroundColor).toBe(cssColor(palette.surface1Contrast))
    expect(inner.style.borderColor).toBe(cssColor(palette.surface3, 'borderColor'))
  })

  it('a raw CSS color passes through', () => {
    renderArrow({ theme: 'light', backgroundColor: '#123456', borderColor: 'rgba(1, 2, 3, 0.5)' })
    const inner = getElement(ARROW_INNER_SELECTOR)
    expect(inner.style.backgroundColor).toBe(cssColor('#123456'))
    expect(inner.style.borderColor).toBe(cssColor('rgba(1, 2, 3, 0.5)', 'borderColor'))
  })
})

/** useSporeColors reads the root `light`/`dark` class; afterEach clears it so no theme leaks. */
function renderThemed(theme: ThemeName, children: ReactNode): RenderResult {
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(theme)
  return render(children)
}

function renderTooltip({
  rootProps = {},
  contentProps = {},
  triggerProps = {},
  arrow = false,
  hostZIndex,
}: {
  rootProps?: Partial<React.ComponentProps<typeof Tooltip>>
  contentProps?: Partial<React.ComponentProps<typeof Tooltip.Content>>
  triggerProps?: Partial<React.ComponentProps<typeof Tooltip.Trigger>>
  arrow?: boolean
  hostZIndex?: number
} = {}): RenderResult {
  const tree = (
    <Tooltip {...rootProps}>
      <Tooltip.Trigger {...triggerProps}>
        <span>trigger</span>
      </Tooltip.Trigger>
      <Tooltip.Content {...contentProps}>
        {arrow ? <Tooltip.Arrow /> : null}
        <div data-testid="tooltip-content">tip</div>
      </Tooltip.Content>
    </Tooltip>
  )
  return renderThemed(
    'light',
    hostZIndex === undefined ? (
      tree
    ) : (
      <EffectiveOverlayZIndexContext.Provider value={hostZIndex}>{tree}</EffectiveOverlayZIndexContext.Provider>
    ),
  )
}

function renderArrow({
  theme,
  backgroundColor,
  borderColor,
}: {
  theme: ThemeName
  backgroundColor: string
  borderColor: string
}): RenderResult {
  return renderThemed(
    theme,
    <Tooltip open>
      <Tooltip.Trigger>
        <span>trigger</span>
      </Tooltip.Trigger>
      <Tooltip.Content>
        <Tooltip.Arrow backgroundColor={backgroundColor} borderColor={borderColor} />
        <div data-testid="tooltip-content">tip</div>
      </Tooltip.Content>
    </Tooltip>,
  )
}

function TooltipInHostedPopover({ host, tooltipOpen }: { host: HTMLElement; tooltipOpen: boolean }): JSX.Element {
  return (
    <PopoverPrimitive.Root open>
      <PopoverPrimitive.Trigger>settings</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal container={host} style={{ display: 'contents' }}>
        <PopoverPrimitive.Positioner style={{ position: 'fixed' }}>
          <PopoverPrimitive.Popup data-testid="popover-popup">
            <Tooltip open={tooltipOpen}>
              <Tooltip.Trigger>
                <span>info</span>
              </Tooltip.Trigger>
              <Tooltip.Content>
                <span data-testid="tooltip-content">tip</span>
              </Tooltip.Content>
            </Tooltip>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

/** The host's flex items: children with display:contents are see-through, out-of-flow children are skipped. */
function inFlowChildren(container: HTMLElement): HTMLElement[] {
  return Array.from(container.children).flatMap((child) => {
    const element = child as HTMLElement
    if (element.style.display === 'contents') {
      return inFlowChildren(element)
    }
    const position = element.style.position
    return position === 'absolute' || position === 'fixed' ? [] : [element]
  })
}

function ZIndexProbe(): JSX.Element {
  const layer = useContext(EffectiveOverlayZIndexContext)
  return <div data-testid="z-probe">{String(layer)}</div>
}

/**
 * jsdom 20 has no PointerEvent, so fireEvent falls back to the bare Event
 * constructor and silently DROPS `pointerType` — attach it explicitly so the
 * trigger's mouse/non-mouse guard (and Base UI's own bookkeeping) sees it.
 */
function firePointerEvent({
  target,
  type,
  pointerType,
}: {
  target: Element
  type: 'pointerdown' | 'pointerup' | 'pointerleave'
  pointerType: 'mouse' | 'touch'
}): void {
  const event = new Event(type, { bubbles: type !== 'pointerleave', cancelable: true })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  fireEvent(target, event)
}

function tap(target: Element): void {
  firePointerEvent({ target, type: 'pointerdown', pointerType: 'touch' })
  fireEvent.click(target)
}

function hover(target: Element): void {
  fireEvent.mouseEnter(target)
  fireEvent.mouseMove(target)
}

function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

/**
 * jsdom normalizes inline-style colors per property (hex → rgb; the
 * border-color shorthand keeps its own spacing) — round-trip expected values
 * through the same CSSOM property.
 */
function cssColor(value: string, property: 'backgroundColor' | 'borderColor' = 'backgroundColor'): string {
  const probe = document.createElement('div')
  probe.style[property] = value
  return probe.style[property]
}

function getElement(selector: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(selector)
  if (!element) {
    throw new Error(`${selector} not rendered`)
  }
  return element
}

function getTrigger(): HTMLElement {
  return getElement(TRIGGER_SELECTOR)
}

function getPositioner(): HTMLElement {
  return getElement(POSITIONER_SELECTOR)
}

function getPopup(): HTMLElement {
  return getElement(POPUP_SELECTOR)
}
