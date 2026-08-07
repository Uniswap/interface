// @vitest-environment jsdom
/**
 * Behavior contract for the Base-UI-backed tooltip compat (INFRA-3021): the
 * legacy `ui/src` Tooltip runtime semantics the CSS parity matrix cannot
 * prove — hover open/close with the legacy delay/restMs timing, controlled
 * open state, the placement/offset mapping, the trigger contract (plain div,
 * style props, asChild), the arrow, and the overlay z-index re-homing
 * (tooltip floor 1080 + the legacy `zIndex` escape hatch) that keeps
 * tooltips above a hosting modal.
 */
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { type ComponentProps, type JSX, type RefObject, useContext } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
// nx-ignore-next-line
import { flexCompatClassName } from '../../../../mycelium/src/flex-compat/compile'
// nx-ignore-next-line
import { EffectiveOverlayZIndexContext, OVERLAY_Z_INDEXES } from '../../../../mycelium/src/popover-compat/z-index'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import {
  mapTooltipDelay,
  TOOLTIP_DEFAULT_DELAY,
  TOOLTIP_DEFAULT_REST_MS,
  tooltipArrowCompatClassName,
  tooltipArrowInnerCompatClassName,
  tooltipContentCompatClassName,
  tooltipMotionClasses,
} from '../../../../mycelium/src/tooltip-compat/compile'
// nx-ignore-next-line
import { TooltipCompat } from '../../../../mycelium/src/tooltip-compat/TooltipCompat'
import { TOOLTIP_PARITY_EXCLUSIONS } from './exclusions'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const POSITIONER_SELECTOR = '[data-slot="tooltip-compat-positioner"]'
const POPUP_SELECTOR = '[data-slot="tooltip-compat-popup"]'
const ARROW_SELECTOR = '[data-slot="tooltip-compat-arrow"]'

type RootProps = Partial<ComponentProps<typeof TooltipCompat>>
type ContentProps = Partial<ComponentProps<typeof TooltipCompat.Content>>
type TriggerProps = Partial<ComponentProps<typeof TooltipCompat.Trigger>>

function renderTooltip({
  rootProps = {},
  contentProps = {},
  triggerProps = {},
  hostZIndex,
  arrow = false,
}: {
  rootProps?: RootProps
  contentProps?: ContentProps
  triggerProps?: TriggerProps
  hostZIndex?: number
  arrow?: boolean
} = {}): ReturnType<typeof render> {
  const tree = (
    <TooltipCompat {...rootProps}>
      <TooltipCompat.Trigger {...triggerProps}>
        <span>trigger</span>
      </TooltipCompat.Trigger>
      <TooltipCompat.Content {...contentProps}>
        {arrow ? <TooltipCompat.Arrow /> : null}
        <div data-testid="tooltip-content">tip</div>
      </TooltipCompat.Content>
    </TooltipCompat>
  )
  return render(
    hostZIndex === undefined ? (
      tree
    ) : (
      <EffectiveOverlayZIndexContext.Provider value={hostZIndex}>{tree}</EffectiveOverlayZIndexContext.Provider>
    ),
  )
}

describe('mapTooltipDelay — the legacy delay/restMs pair onto Base UI trigger timing', () => {
  it('maps the ui/src styled defaults (delay {close: 500, open: 0} + restMs 200 → open 200 / close 500)', () => {
    expect(mapTooltipDelay({ delay: TOOLTIP_DEFAULT_DELAY, restMs: TOOLTIP_DEFAULT_REST_MS })).toEqual({
      openDelayMs: 200,
      closeDelayMs: 500,
    })
  })

  it('maps the InfoTooltip call-site timings (delay {close: 100, open: 0} + restMs 20)', () => {
    expect(mapTooltipDelay({ delay: { close: 100, open: 0 }, restMs: 20 })).toEqual({
      openDelayMs: 20,
      closeDelayMs: 100,
    })
  })

  it('a nonzero open delay wins over restMs (floating-ui delay precedence)', () => {
    expect(mapTooltipDelay({ delay: { open: 300, close: 50 }, restMs: 200 })).toEqual({
      openDelayMs: 300,
      closeDelayMs: 50,
    })
  })

  it('a numeric delay applies to both open and close, like floating-ui', () => {
    expect(mapTooltipDelay({ delay: 250, restMs: 200 })).toEqual({ openDelayMs: 250, closeDelayMs: 250 })
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

describe('TooltipCompat — uncontrolled hover timing (the legacy default interaction)', () => {
  it('opens after the mapped open delay on hover, not before (defaults: 200ms)', () => {
    vi.useFakeTimers()
    renderTooltip()
    const trigger = document.querySelector('[data-slot="tooltip-compat-trigger"]') as HTMLElement
    fireEvent.mouseEnter(trigger)
    fireEvent.mouseMove(trigger)
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(screen.queryByTestId('tooltip-content')).toBeNull()
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(screen.getByTestId('tooltip-content')).toBeTruthy()
  })

  it('closes after the mapped close delay on hover-out (defaults: 500ms)', () => {
    vi.useFakeTimers()
    renderTooltip()
    const trigger = document.querySelector('[data-slot="tooltip-compat-trigger"]') as HTMLElement
    fireEvent.mouseEnter(trigger)
    fireEvent.mouseMove(trigger)
    act(() => {
      vi.advanceTimersByTime(250)
    })
    expect(screen.getByTestId('tooltip-content')).toBeTruthy()
    fireEvent.mouseLeave(trigger)
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(screen.getByTestId('tooltip-content')).toBeTruthy()
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(screen.queryByTestId('tooltip-content')).toBeNull()
  })
})

describe('TooltipCompat — trigger contract (Tamagui stack semantics)', () => {
  it('renders a plain div trigger (not a native button) with the compiled style-prop classes', () => {
    renderTooltip({ triggerProps: { flex: 1, width: '100%' } })
    const trigger = document.querySelector('[data-slot="tooltip-compat-trigger"]') as HTMLElement
    expect(trigger).toBeTruthy()
    expect(trigger.tagName).toBe('DIV')
    expect(trigger.className).toBe(flexCompatClassName({ flex: 1, width: '100%' }))
  })

  it('asChild renders the child element itself as the trigger, like Tamagui', () => {
    render(
      <TooltipCompat open>
        <TooltipCompat.Trigger asChild>
          <button type="button" data-testid="as-child-trigger">
            trigger
          </button>
        </TooltipCompat.Trigger>
        <TooltipCompat.Content>
          <div data-testid="tooltip-content">tip</div>
        </TooltipCompat.Content>
      </TooltipCompat>,
    )
    const trigger = screen.getByTestId('as-child-trigger')
    expect(trigger.getAttribute('data-slot')).toBe('tooltip-compat-trigger')
    expect(document.querySelectorAll('[data-slot="tooltip-compat-trigger"]')).toHaveLength(1)
    // Content-wipe guard: the compat must not pass a `children` prop alongside
    // `render` — if Base UI ever applied one, the child's own content would be
    // wiped and the trigger would render empty.
    expect(trigger.textContent).toBe('trigger')
  })

  it('asChild forwards the compiled style-prop classes to the child, composed with its own className (Tamagui asChild parity)', () => {
    render(
      <TooltipCompat open>
        <TooltipCompat.Trigger asChild width="100%">
          <button type="button" data-testid="as-child-trigger" className="own-class">
            trigger
          </button>
        </TooltipCompat.Trigger>
        <TooltipCompat.Content>
          <div data-testid="tooltip-content">tip</div>
        </TooltipCompat.Content>
      </TooltipCompat>,
    )
    const trigger = screen.getByTestId('as-child-trigger')
    expect(trigger.textContent).toBe('trigger')
    expect(trigger.className).toContain('own-class')
    for (const compiled of flexCompatClassName({ width: '100%' }).split(' ')) {
      expect(trigger.className).toContain(compiled)
    }
  })

  it('asChild chains the child onClick with the mapped onPress (child first)', () => {
    const calls: string[] = []
    const childOnClick = vi.fn(() => calls.push('child'))
    const onPress = vi.fn(() => calls.push('onPress'))
    render(
      <TooltipCompat open>
        <TooltipCompat.Trigger asChild onPress={onPress}>
          <button type="button" data-testid="as-child-trigger" onClick={childOnClick}>
            trigger
          </button>
        </TooltipCompat.Trigger>
        <TooltipCompat.Content>
          <div data-testid="tooltip-content">tip</div>
        </TooltipCompat.Content>
      </TooltipCompat>,
    )
    fireEvent.click(screen.getByTestId('as-child-trigger'))
    expect(screen.getByTestId('as-child-trigger').textContent).toBe('trigger')
    expect(childOnClick).toHaveBeenCalledTimes(1)
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(calls).toEqual(['child', 'onPress'])
  })

  it('forwards the non-style DOM surface on the div trigger (testID → data-testid, aria/id/role passthrough)', () => {
    // Same seam and conventions as the popover compat (`domProps` +
    // `data-testid`): the drop-in surface accepts these, so they must reach
    // the DOM, not just feed the className compiler.
    renderTooltip({
      triggerProps: { testID: 'trigger-test-id', 'aria-label': 'trigger label', id: 'trigger-id', role: 'button' },
    })
    const trigger = screen.getByTestId('trigger-test-id')
    expect(trigger.getAttribute('data-slot')).toBe('tooltip-compat-trigger')
    expect(trigger.getAttribute('aria-label')).toBe('trigger label')
    expect(trigger.getAttribute('id')).toBe('trigger-id')
    expect(trigger.getAttribute('role')).toBe('button')
  })

  it('asChild merges the non-style DOM surface onto the child element', () => {
    render(
      <TooltipCompat open>
        <TooltipCompat.Trigger asChild testID="as-child-test-id" aria-label="child label" id="child-id" role="button">
          <span className="own-class">trigger</span>
        </TooltipCompat.Trigger>
        <TooltipCompat.Content>
          <div data-testid="tooltip-content">tip</div>
        </TooltipCompat.Content>
      </TooltipCompat>,
    )
    const trigger = screen.getByTestId('as-child-test-id')
    expect(trigger.tagName).toBe('SPAN')
    expect(trigger.textContent).toBe('trigger')
    expect(trigger.className).toContain('own-class')
    expect(trigger.getAttribute('aria-label')).toBe('child label')
    expect(trigger.getAttribute('id')).toBe('child-id')
    expect(trigger.getAttribute('role')).toBe('button')
  })

  it('asChild without a compat testID keeps the child own data-testid (no undefined clobber)', () => {
    render(
      <TooltipCompat open>
        <TooltipCompat.Trigger asChild>
          <span data-testid="child-own-testid">trigger</span>
        </TooltipCompat.Trigger>
        <TooltipCompat.Content>
          <div data-testid="tooltip-content">tip</div>
        </TooltipCompat.Content>
      </TooltipCompat>,
    )
    expect(screen.getByTestId('child-own-testid').textContent).toBe('trigger')
  })

  it('asChild forwards the trigger ref to the child element, composing with the child own ref', () => {
    const forwardedRef = { current: null as HTMLElement | null }
    const childRef = vi.fn()
    render(
      <TooltipCompat open>
        <TooltipCompat.Trigger asChild ref={forwardedRef as RefObject<HTMLDivElement>}>
          <button type="button" data-testid="as-child-trigger" ref={childRef}>
            trigger
          </button>
        </TooltipCompat.Trigger>
        <TooltipCompat.Content>
          <div data-testid="tooltip-content">tip</div>
        </TooltipCompat.Content>
      </TooltipCompat>,
    )
    const trigger = screen.getByTestId('as-child-trigger')
    expect(trigger.textContent).toBe('trigger')
    expect(forwardedRef.current).toBe(trigger)
    expect(childRef).toHaveBeenCalledWith(trigger)
  })
})

describe('TooltipCompat — placement mapping onto Base UI anchor positioning', () => {
  it('renders the popup on the requested side (top-start → side top / align start)', () => {
    renderTooltip({ rootProps: { open: true, placement: 'top-start' } })
    const popup = document.querySelector(POPUP_SELECTOR) as HTMLElement
    expect(popup.getAttribute('data-side')).toBe('top')
    expect(popup.getAttribute('data-align')).toBe('start')
  })

  it('defaults to the legacy ui/src placement: bottom, centered', async () => {
    // Legacy source of truth: the styled TooltipRoot in
    // packages/ui/src/components/tooltip/Tooltip.web.tsx sets no `placement`,
    // so the legacy default is @tamagui/popper's `placement = 'bottom'`
    // (centered). Pinned as literals — NOT derived through
    // mapPlacementToAnchorPosition — so a compat-side default drift fails here.
    renderTooltip({ rootProps: { open: true } })
    const popup = document.querySelector(POPUP_SELECTOR) as HTMLElement
    expect(popup.getAttribute('data-side')).toBe('bottom')
    expect(popup.getAttribute('data-align')).toBe('center')
    // The legacy default offset `{ mainAxis: 16 }` must reach Base UI's
    // positioner as `sideOffset` 16: in jsdom every rect is zero-sized at the
    // origin, so the positioner's floating-ui translation equals the
    // sideOffset exactly. Pinned as a literal — NOT derived through
    // mapOffsetToAnchorPosition — so a default-offset drift fails here.
    const positioner = document.querySelector(POSITIONER_SELECTOR) as HTMLElement
    await waitFor(() => {
      expect(positioner.style.transform).toBe('translate(0px, 16px)')
    })
  })
})

describe('TooltipCompat — overlay z-index re-homing (tooltip floor 1080)', () => {
  it('defaults to the tooltip layer (1080) with no host overlay', () => {
    renderTooltip({ rootProps: { open: true } })
    const positioner = document.querySelector(POSITIONER_SELECTOR) as HTMLElement
    expect(Number(positioner.style.zIndex)).toBe(OVERLAY_Z_INDEXES.tooltip)
  })

  it('stacks above a hosting modal at z-1060', () => {
    renderTooltip({ rootProps: { open: true }, hostZIndex: OVERLAY_Z_INDEXES.modal })
    const positioner = document.querySelector(POSITIONER_SELECTOR) as HTMLElement
    expect(Number(positioner.style.zIndex)).toBeGreaterThan(OVERLAY_Z_INDEXES.modal)
    expect(Number(positioner.style.zIndex)).toBe(OVERLAY_Z_INDEXES.tooltip)
  })

  it('stacks one above an extension-style overlay host (100010 → 100011)', () => {
    renderTooltip({ rootProps: { open: true }, hostZIndex: OVERLAY_Z_INDEXES.overlay })
    const positioner = document.querySelector(POSITIONER_SELECTOR) as HTMLElement
    expect(Number(positioner.style.zIndex)).toBe(OVERLAY_Z_INDEXES.overlay + 1)
  })

  it('honors the legacy numeric zIndex escape hatch', () => {
    renderTooltip({ rootProps: { open: true }, contentProps: { zIndex: 4321 } })
    const positioner = document.querySelector(POSITIONER_SELECTOR) as HTMLElement
    expect(Number(positioner.style.zIndex)).toBe(4321)
  })

  it('re-provides the bumped layer to descendants, like the legacy content does', () => {
    function Probe(): JSX.Element {
      const value = useContext(EffectiveOverlayZIndexContext)
      return <div data-testid="z-probe">{String(value)}</div>
    }
    render(
      <EffectiveOverlayZIndexContext.Provider value={OVERLAY_Z_INDEXES.overlay}>
        <TooltipCompat open>
          <TooltipCompat.Trigger>
            <span>trigger</span>
          </TooltipCompat.Trigger>
          <TooltipCompat.Content>
            <Probe />
          </TooltipCompat.Content>
        </TooltipCompat>
      </EffectiveOverlayZIndexContext.Provider>,
    )
    expect(screen.getByTestId('z-probe').textContent).toBe(String(OVERLAY_Z_INDEXES.overlay + 1))
  })
})

describe('TooltipCompat — content DOM surface (popover compat conventions)', () => {
  it('forwards the non-style DOM surface onto the popup (testID → data-testid, aria/id/role passthrough)', () => {
    renderTooltip({
      rootProps: { open: true },
      contentProps: { testID: 'content-test-id', 'aria-label': 'content label', id: 'content-id', role: 'status' },
    })
    const popup = document.querySelector(POPUP_SELECTOR) as HTMLElement
    expect(popup.getAttribute('data-testid')).toBe('content-test-id')
    expect(popup.getAttribute('aria-label')).toBe('content label')
    expect(popup.getAttribute('id')).toBe('content-id')
    expect(popup.getAttribute('role')).toBe('status')
  })
})

describe('TooltipCompat — styling surface', () => {
  it('renders exactly the classes the pure compiler produces for a real call-site fragment', () => {
    const styleProps = { maxWidth: 280, pointerEvents: 'auto' } as const
    renderTooltip({ rootProps: { open: true }, contentProps: styleProps })
    const popup = document.querySelector(POPUP_SELECTOR) as HTMLElement
    expect(popup.className).toBe(tooltipContentCompatClassName(styleProps))
  })

  it('compiles the legacy ±4px directional enter/exit per animationDirection (default top)', () => {
    expect(tooltipMotionClasses()).toContain('data-starting-style:translate-y-[4px]')
    expect(tooltipMotionClasses('bottom')).toContain('data-starting-style:translate-y-[-4px]')
    expect(tooltipMotionClasses('left')).toContain('data-starting-style:translate-x-[4px]')
    expect(tooltipMotionClasses('right')).toContain('data-ending-style:translate-x-[-4px]')
  })

  it('renders the arrow inside the popup with exactly the compiled arrow classes', () => {
    renderTooltip({ rootProps: { open: true }, arrow: true })
    const arrow = document.querySelector(ARROW_SELECTOR) as HTMLElement
    expect(arrow).toBeTruthy()
    expect(arrow.className).toBe(tooltipArrowCompatClassName())
    expect((document.querySelector(POPUP_SELECTOR) as HTMLElement).contains(arrow)).toBe(true)
    // Two-element arrow (design feedback): the Base UI Arrow part is the
    // overflow-hidden clip window; the rotated square with the body
    // background + outer-edge-only border is its inner child — so the tip
    // merges with the popup body as one continuous shape.
    const inner = arrow.querySelector('[data-slot="tooltip-compat-arrow-inner"]') as HTMLElement
    expect(inner).toBeTruthy()
    expect(inner.className).toBe(tooltipArrowInnerCompatClassName())
  })
})

describe('tooltip exclusions ledger', () => {
  it('stays non-empty and documented (no silent deltas)', () => {
    expect(TOOLTIP_PARITY_EXCLUSIONS.length).toBeGreaterThan(0)
    for (const exclusion of TOOLTIP_PARITY_EXCLUSIONS) {
      expect(exclusion.reason.length).toBeGreaterThan(20)
      expect(exclusion.standIn.length).toBeGreaterThan(20)
    }
  })

  it('flags the Radix components/tooltip.tsx coexistence prominently', () => {
    const coexistence = TOOLTIP_PARITY_EXCLUSIONS.find((entry) => entry.area.includes('Coexistence'))
    expect(coexistence?.reason).toContain('mission-control')
  })
})

describe('tooltip-compat platform legs — export parity', () => {
  it('the native leg exports every runtime symbol the web leg exports (bundler-resolution parity)', async () => {
    const [nativeLeg, webLeg] = await Promise.all([
      import('../../../../mycelium/src/tooltip-compat/index.native'),
      import('../../../../mycelium/src/tooltip-compat/index.web'),
    ])
    expect(Object.keys(nativeLeg).sort()).toEqual(Object.keys(webLeg).sort())
    // Platform-neutral values are REAL on native (loud throws stay reserved
    // for the web-only components and className compilers).
    expect(nativeLeg.TOOLTIP_DEFAULT_DELAY).toEqual(webLeg.TOOLTIP_DEFAULT_DELAY)
    expect(nativeLeg.TOOLTIP_DEFAULT_OFFSET).toEqual(webLeg.TOOLTIP_DEFAULT_OFFSET)
    expect(nativeLeg.TOOLTIP_DEFAULT_REST_MS).toBe(webLeg.TOOLTIP_DEFAULT_REST_MS)
    expect(nativeLeg.TOOLTIP_CONTENT_FRAME_DEFAULTS).toEqual(webLeg.TOOLTIP_CONTENT_FRAME_DEFAULTS)
    expect(nativeLeg.mapTooltipDelay({ delay: 300, restMs: 200 })).toEqual(
      webLeg.mapTooltipDelay({ delay: 300, restMs: 200 }),
    )
    expect(() => nativeLeg.tooltipMotionClasses()).toThrow(/web-only/)
  })
})
