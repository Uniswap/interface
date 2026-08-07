// @vitest-environment jsdom
/**
 * Behavior contract for the Base-UI-backed popover compat (INFRA-3021):
 * the legacy `AdaptiveWebPopoverContent` runtime semantics the CSS parity
 * matrix cannot prove — controlled open state, the placement/offset mapping
 * onto Base UI anchor positioning, and the overlay z-index re-homing
 * (`EffectiveModalOrSheetZIndexContext` equivalent) that keeps popovers above
 * a hosting modal instead of a naive portal landing at z≈1000 behind a
 * z-1060 modal.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { type ComponentProps, type JSX, useContext } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import {
  AdaptiveWebPopoverContentCompat,
  adaptiveWebPopoverContentCompatClassName,
  EffectiveOverlayZIndexContext,
  mapOffsetToAnchorPosition,
  mapPlacementToAnchorPosition,
  OVERLAY_Z_INDEXES,
  PopoverCompat,
  stackingLayerAbove,
} from '../../../../mycelium/src/popover-compat'
import { POPOVER_PARITY_EXCLUSIONS } from './exclusions'

afterEach(cleanup)

const POSITIONER_SELECTOR = '[data-slot="adaptive-popover-positioner"]'
const POPUP_SELECTOR = '[data-slot="adaptive-popover-popup"]'

type ContentProps = Partial<ComponentProps<typeof AdaptiveWebPopoverContentCompat>>

function renderPopover({
  open,
  hostZIndex,
  contentProps = {},
  onOpenChange,
}: {
  open: boolean
  hostZIndex?: number
  contentProps?: ContentProps
  onOpenChange?: (open: boolean) => void
}): ReturnType<typeof render> {
  const tree = (
    <PopoverCompat open={open} onOpenChange={onOpenChange} placement="bottom-end">
      <PopoverCompat.Trigger>
        <button type="button">trigger</button>
      </PopoverCompat.Trigger>
      <AdaptiveWebPopoverContentCompat isOpen={open} {...contentProps}>
        <div data-testid="popover-content">content</div>
      </AdaptiveWebPopoverContentCompat>
    </PopoverCompat>
  )
  return render(
    hostZIndex === undefined ? (
      tree
    ) : (
      <EffectiveOverlayZIndexContext.Provider value={hostZIndex}>{tree}</EffectiveOverlayZIndexContext.Provider>
    ),
  )
}

describe('stackingLayerAbove — the overlay z-index bridge math', () => {
  it('floors at the popover layer when there is no host overlay', () => {
    expect(stackingLayerAbove(undefined, OVERLAY_Z_INDEXES.popover)).toBe(OVERLAY_Z_INDEXES.popover)
  })

  it('stays at the popover floor above a standard modal (1060 host → 1070)', () => {
    expect(stackingLayerAbove(OVERLAY_Z_INDEXES.modal, OVERLAY_Z_INDEXES.popover)).toBe(OVERLAY_Z_INDEXES.popover)
    expect(stackingLayerAbove(OVERLAY_Z_INDEXES.modal, OVERLAY_Z_INDEXES.popover)).toBeGreaterThan(
      OVERLAY_Z_INDEXES.modal,
    )
  })

  it('bumps one above a host that already exceeds the floor (extension overlay 100010 → 100011)', () => {
    expect(stackingLayerAbove(OVERLAY_Z_INDEXES.overlay, OVERLAY_Z_INDEXES.popover)).toBe(OVERLAY_Z_INDEXES.overlay + 1)
  })

  it('never renders at or below the host layer', () => {
    for (const host of [0, 900, 999, 1000, 1059, 1060, 1070, 100010]) {
      expect(stackingLayerAbove(host, OVERLAY_Z_INDEXES.popover)).toBeGreaterThan(host)
    }
  })
})

describe('placement/offset mapping — Tamagui popover vocabulary onto Base UI anchor positioning', () => {
  it('maps the four ContextMenu placements', () => {
    expect(mapPlacementToAnchorPosition('top-start')).toEqual({ side: 'top', align: 'start' })
    expect(mapPlacementToAnchorPosition('top-end')).toEqual({ side: 'top', align: 'end' })
    expect(mapPlacementToAnchorPosition('bottom-start')).toEqual({ side: 'bottom', align: 'start' })
    expect(mapPlacementToAnchorPosition('bottom-end')).toEqual({ side: 'bottom', align: 'end' })
  })

  it('maps bare sides to center alignment and defaults to bottom/center like Tamagui', () => {
    expect(mapPlacementToAnchorPosition('top')).toEqual({ side: 'top', align: 'center' })
    expect(mapPlacementToAnchorPosition('right')).toEqual({ side: 'right', align: 'center' })
    expect(mapPlacementToAnchorPosition('left-end')).toEqual({ side: 'left', align: 'end' })
    expect(mapPlacementToAnchorPosition(undefined)).toEqual({ side: 'bottom', align: 'center' })
  })

  it('preserves the legacy floating-ui physical crossAxis semantics through Base UI alignOffset', () => {
    // Legacy passes floating-ui offset({ mainAxis, crossAxis }) with PHYSICAL
    // crossAxis. Base UI routes alignOffset through floating-ui's
    // alignmentAxis, which flips sign for `end` alignment — the mapper must
    // pre-flip so the rendered offset stays physical.
    expect(mapOffsetToAnchorPosition({ offset: { mainAxis: 5, crossAxis: 7 }, align: 'start' })).toEqual({
      sideOffset: 5,
      alignOffset: 7,
    })
    expect(mapOffsetToAnchorPosition({ offset: { mainAxis: 5, crossAxis: 7 }, align: 'end' })).toEqual({
      sideOffset: 5,
      alignOffset: -7,
    })
    expect(mapOffsetToAnchorPosition({ offset: 12, align: 'end' })).toEqual({ sideOffset: 12, alignOffset: 0 })
    expect(mapOffsetToAnchorPosition({ offset: undefined, align: 'center' })).toEqual({
      sideOffset: 0,
      alignOffset: 0,
    })
  })
})

describe('AdaptiveWebPopoverContentCompat — controlled open state', () => {
  it('renders nothing while closed and the portal content while open', () => {
    const { rerender } = renderPopover({ open: false })
    expect(screen.queryByTestId('popover-content')).toBeNull()
    rerender(
      <PopoverCompat open placement="bottom-end">
        <PopoverCompat.Trigger>
          <button type="button">trigger</button>
        </PopoverCompat.Trigger>
        <AdaptiveWebPopoverContentCompat isOpen>
          <div data-testid="popover-content">content</div>
        </AdaptiveWebPopoverContentCompat>
      </PopoverCompat>,
    )
    expect(screen.getByTestId('popover-content')).toBeTruthy()
  })

  it('requests close through onOpenChange on Escape without self-closing (stays controlled)', () => {
    const onOpenChange = vi.fn()
    renderPopover({ open: true, onOpenChange })
    fireEvent.keyDown(screen.getByTestId('popover-content'), { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false)
    // Fully controlled: the popup only unmounts when the owner flips `open`.
    expect(screen.getByTestId('popover-content')).toBeTruthy()
  })

  it('requests close through onOpenChange on OUTSIDE PRESS without self-closing (legacy useDismiss parity)', () => {
    // Legacy parity evidence: Tamagui Popover wires floating-ui useDismiss
    // with defaults (@tamagui/popover useFloatingContext.tsx), which requests
    // close on outside press exactly like on Escape — so the compat forwards
    // ALL Base UI close requests unfiltered. Layers that own their dismissal
    // (the menu compat) filter in their OWN onOpenChange instead.
    const onOpenChange = vi.fn()
    renderPopover({ open: true, onOpenChange })
    fireEvent.pointerDown(document.body)
    fireEvent.mouseDown(document.body)
    fireEvent.mouseUp(document.body)
    fireEvent.click(document.body)
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false)
    // Fully controlled: the popup only unmounts when the owner flips `open`.
    expect(screen.getByTestId('popover-content')).toBeTruthy()
  })

  it('adaptToSheet/isSheet is accepted but the sheet leg is gated: still renders the popover (INFRA-3021 deferral)', () => {
    renderPopover({ open: true, contentProps: { isSheet: true, webBottomSheetProps: { onClose: () => undefined } } })
    expect(screen.getByTestId('popover-content')).toBeTruthy()
    expect(document.querySelector(POPUP_SELECTOR)).toBeTruthy()
  })
})

describe('AdaptiveWebPopoverContentCompat — overlay z-index re-homing (the in-modal regression trap)', () => {
  it('defaults to the popover layer (1070) with no host overlay', () => {
    renderPopover({ open: true })
    const positioner = document.querySelector(POSITIONER_SELECTOR) as HTMLElement
    expect(positioner).toBeTruthy()
    expect(Number(positioner.style.zIndex)).toBe(OVERLAY_Z_INDEXES.popover)
  })

  it('stacks above a hosting modal at z-1060 (naive portals land at z≈1000, BEHIND the modal)', () => {
    renderPopover({ open: true, hostZIndex: OVERLAY_Z_INDEXES.modal })
    const positioner = document.querySelector(POSITIONER_SELECTOR) as HTMLElement
    expect(Number(positioner.style.zIndex)).toBeGreaterThan(OVERLAY_Z_INDEXES.modal)
    expect(Number(positioner.style.zIndex)).toBe(OVERLAY_Z_INDEXES.popover)
  })

  it('stacks one above an extension-style overlay host (100010 → 100011)', () => {
    renderPopover({ open: true, hostZIndex: OVERLAY_Z_INDEXES.overlay })
    const positioner = document.querySelector(POSITIONER_SELECTOR) as HTMLElement
    expect(Number(positioner.style.zIndex)).toBe(OVERLAY_Z_INDEXES.overlay + 1)
  })

  it('re-provides the bumped layer to descendants, like the legacy content does', () => {
    function Probe(): JSX.Element {
      const value = useContext(EffectiveOverlayZIndexContext)
      return <div data-testid="z-probe">{String(value)}</div>
    }
    render(
      <EffectiveOverlayZIndexContext.Provider value={OVERLAY_Z_INDEXES.overlay}>
        <PopoverCompat open>
          <PopoverCompat.Trigger>
            <button type="button">trigger</button>
          </PopoverCompat.Trigger>
          <AdaptiveWebPopoverContentCompat isOpen>
            <Probe />
          </AdaptiveWebPopoverContentCompat>
        </PopoverCompat>
      </EffectiveOverlayZIndexContext.Provider>,
    )
    expect(screen.getByTestId('z-probe').textContent).toBe(String(OVERLAY_Z_INDEXES.overlay + 1))
  })
})

describe('AdaptiveWebPopoverContentCompat — styling surface', () => {
  it('renders exactly the classes the pure compiler produces for the ContextMenu call-site fragment', () => {
    const styleProps = { backgroundColor: 'transparent', p: '$none', py: '$spacing8' } as const
    renderPopover({ open: true, contentProps: styleProps })
    const popup = document.querySelector(POPUP_SELECTOR) as HTMLElement
    expect(popup).toBeTruthy()
    expect(popup.className).toBe(adaptiveWebPopoverContentCompatClassName(styleProps))
  })

  it('uncontrolled trigger interaction opens the popup (Tamagui Popover.Trigger semantics)', () => {
    render(
      <PopoverCompat>
        <PopoverCompat.Trigger>
          <button type="button">trigger</button>
        </PopoverCompat.Trigger>
        <AdaptiveWebPopoverContentCompat isOpen={false}>
          <div data-testid="popover-content">content</div>
        </AdaptiveWebPopoverContentCompat>
      </PopoverCompat>,
    )
    expect(screen.queryByTestId('popover-content')).toBeNull()
    fireEvent.click(screen.getByText('trigger'))
    expect(screen.getByTestId('popover-content')).toBeTruthy()
  })
})

describe('AdaptiveWebPopoverContentCompat — event/aria/testID forwarding (legacy frame spread)', () => {
  it('dispatches the onPress family and honors stopPropagation (the TokenHoverCard stopPressEventPropagation shape)', () => {
    const onPress = vi.fn((e: { stopPropagation: () => void }) => e.stopPropagation())
    const onPressIn = vi.fn((e: { stopPropagation: () => void }) => e.stopPropagation())
    const onPressOut = vi.fn((e: { stopPropagation: () => void }) => e.stopPropagation())
    const outerClick = vi.fn()
    render(
      // Portaled popups still bubble through the REACT tree — without the
      // forwarded handlers, presses inside the hover card leak to ancestors.
      <div onClick={outerClick}>
        <PopoverCompat open placement="bottom-end">
          <PopoverCompat.Trigger>
            <button type="button">trigger</button>
          </PopoverCompat.Trigger>
          <AdaptiveWebPopoverContentCompat isOpen onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
            <div data-testid="popover-content">content</div>
          </AdaptiveWebPopoverContentCompat>
        </PopoverCompat>
      </div>,
    )
    const popup = document.querySelector(POPUP_SELECTOR) as HTMLElement
    fireEvent.pointerDown(popup)
    fireEvent.pointerUp(popup)
    fireEvent.click(popup)
    expect(onPressIn).toHaveBeenCalledTimes(1)
    expect(onPressOut).toHaveBeenCalledTimes(1)
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(outerClick).not.toHaveBeenCalled()
  })

  it('forwards aria attributes and testID onto the popup element', () => {
    renderPopover({ open: true, contentProps: { 'aria-label': 'hover card', testID: 'hover-card-popup' } })
    const popup = document.querySelector(POPUP_SELECTOR) as HTMLElement
    expect(popup.getAttribute('aria-label')).toBe('hover card')
    expect(screen.getByTestId('hover-card-popup')).toBe(popup)
  })
})

describe('AdaptiveWebPopoverContentCompat — wired FocusScope surface (production a11y hooks)', () => {
  it('fires onOpenAutoFocus on open; preventDefault keeps focus where it was (SendRecipientForm pattern)', async () => {
    const onOpenAutoFocus = vi.fn((event: Event) => event.preventDefault())
    renderPopover({ open: true, contentProps: { onOpenAutoFocus } })
    await waitFor(() => expect(onOpenAutoFocus).toHaveBeenCalledTimes(1))
    const popup = document.querySelector(POPUP_SELECTOR) as HTMLElement
    expect(popup.contains(document.activeElement)).toBe(false)
  })

  it('an unprevented onOpenAutoFocus lets Base UI move focus into the popup', async () => {
    const onOpenAutoFocus = vi.fn()
    renderPopover({ open: true, contentProps: { onOpenAutoFocus } })
    await waitFor(() => expect(onOpenAutoFocus).toHaveBeenCalledTimes(1))
    await waitFor(() => {
      const popup = document.querySelector(POPUP_SELECTOR) as HTMLElement
      expect(popup.contains(document.activeElement) || popup === document.activeElement).toBe(true)
    })
  })

  it('the handler can move focus itself after preventDefault (RecentlyConnectedModal pattern)', async () => {
    function Host(): JSX.Element {
      const buttonRef = { current: null as HTMLButtonElement | null }
      return (
        <PopoverCompat open placement="bottom-end">
          <PopoverCompat.Trigger>
            <button type="button">trigger</button>
          </PopoverCompat.Trigger>
          <AdaptiveWebPopoverContentCompat
            isOpen
            onOpenAutoFocus={(event) => {
              event.preventDefault()
              buttonRef.current?.focus()
            }}
          >
            <button type="button" data-testid="login" ref={(node) => (buttonRef.current = node)}>
              login
            </button>
          </AdaptiveWebPopoverContentCompat>
        </PopoverCompat>
      )
    }
    render(<Host />)
    await waitFor(() => expect(document.activeElement).toBe(screen.getByTestId('login')))
  })

  it('the default stays no-focus-move when no callback is provided (legacy parity pin)', () => {
    renderPopover({ open: true })
    const popup = document.querySelector(POPUP_SELECTOR) as HTMLElement
    expect(popup.contains(document.activeElement)).toBe(false)
  })

  it('disableFocusScope forces no focus move even with an unprevented onOpenAutoFocus (SendRecipientForm pattern)', () => {
    const onOpenAutoFocus = vi.fn()
    renderPopover({ open: true, contentProps: { disableFocusScope: true, onOpenAutoFocus } })
    const popup = document.querySelector(POPUP_SELECTOR) as HTMLElement
    expect(popup.contains(document.activeElement)).toBe(false)
  })

  it('accepts onCloseAutoFocus={false} (BalanceBreakdownPopover pattern) and function form without crashing', () => {
    const { rerender } = renderPopover({
      open: true,
      contentProps: { onCloseAutoFocus: false },
    })
    rerender(
      <PopoverCompat open={false} placement="bottom-end">
        <PopoverCompat.Trigger>
          <button type="button">trigger</button>
        </PopoverCompat.Trigger>
        <AdaptiveWebPopoverContentCompat isOpen={false} onCloseAutoFocus={false}>
          <div data-testid="popover-content">content</div>
        </AdaptiveWebPopoverContentCompat>
      </PopoverCompat>,
    )
    expect(screen.queryByTestId('popover-content')).toBeNull()
  })

  it('forwards onFocusCapture/onBlurCapture to the popup element', () => {
    const onFocusCapture = vi.fn()
    const onBlurCapture = vi.fn()
    render(
      <PopoverCompat open placement="bottom-end">
        <PopoverCompat.Trigger>
          <button type="button">trigger</button>
        </PopoverCompat.Trigger>
        <AdaptiveWebPopoverContentCompat isOpen onFocusCapture={onFocusCapture} onBlurCapture={onBlurCapture}>
          <button type="button" data-testid="inner">
            inner
          </button>
        </AdaptiveWebPopoverContentCompat>
      </PopoverCompat>,
    )
    const inner = screen.getByTestId('inner')
    fireEvent.focus(inner)
    fireEvent.blur(inner)
    expect(onFocusCapture).toHaveBeenCalled()
    expect(onBlurCapture).toHaveBeenCalled()
  })
})

describe('AdaptiveWebPopoverContentCompat — wired Dismissable interceptors', () => {
  it('onEscapeKeyDown fires with a KeyboardEvent; preventDefault swallows the close request', () => {
    const onOpenChange = vi.fn()
    const onEscapeKeyDown = vi.fn((event: KeyboardEvent) => {
      expect(event.key).toBe('Escape')
      event.preventDefault()
    })
    renderPopover({ open: true, onOpenChange, contentProps: { onEscapeKeyDown } })
    fireEvent.keyDown(screen.getByTestId('popover-content'), { key: 'Escape' })
    expect(onEscapeKeyDown).toHaveBeenCalledTimes(1)
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('an unprevented onEscapeKeyDown still forwards the close request', () => {
    const onOpenChange = vi.fn()
    const onEscapeKeyDown = vi.fn()
    renderPopover({ open: true, onOpenChange, contentProps: { onEscapeKeyDown } })
    fireEvent.keyDown(screen.getByTestId('popover-content'), { key: 'Escape' })
    expect(onEscapeKeyDown).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('outside press runs onPointerDownOutside + onInteractOutside; preventDefault swallows the request', () => {
    const onOpenChange = vi.fn()
    const onPointerDownOutside = vi.fn((event: CustomEvent) => event.preventDefault())
    const onInteractOutside = vi.fn()
    renderPopover({ open: true, onOpenChange, contentProps: { onPointerDownOutside, onInteractOutside } })
    fireEvent.pointerDown(document.body)
    fireEvent.mouseDown(document.body)
    fireEvent.mouseUp(document.body)
    fireEvent.click(document.body)
    expect(onPointerDownOutside).toHaveBeenCalledTimes(1)
    expect(onInteractOutside).toHaveBeenCalledTimes(1)
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('an unprevented outside press still forwards the close request', () => {
    const onOpenChange = vi.fn()
    const onPointerDownOutside = vi.fn()
    renderPopover({ open: true, onOpenChange, contentProps: { onPointerDownOutside } })
    fireEvent.pointerDown(document.body)
    fireEvent.mouseDown(document.body)
    fireEvent.mouseUp(document.body)
    fireEvent.click(document.body)
    expect(onPointerDownOutside).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('accepts the inert styled-variant shorthands without leaking classes (elevate call-site shape)', () => {
    renderPopover({
      open: true,
      contentProps: { elevate: true, bordered: true, transparent: true, backgroundColor: '$surface1' },
    })
    const popup = document.querySelector(POPUP_SELECTOR) as HTMLElement
    expect(popup.className).toBe(
      adaptiveWebPopoverContentCompatClassName({ backgroundColor: '$surface1', placement: 'bottom-end' }),
    )
  })
})

describe('popover-compat platform legs — export parity', () => {
  it('the native leg exports every runtime symbol the web leg exports (bundler-resolution parity)', async () => {
    const [nativeLeg, webLeg] = await Promise.all([
      import('../../../../mycelium/src/popover-compat/index.native'),
      import('../../../../mycelium/src/popover-compat/index.web'),
    ])
    expect(Object.keys(nativeLeg).sort()).toEqual(Object.keys(webLeg).sort())
    // Platform-neutral values are REAL on native (loud throws stay reserved
    // for the web-only components).
    expect(nativeLeg.OVERLAY_Z_INDEXES).toEqual(webLeg.OVERLAY_Z_INDEXES)
    expect(nativeLeg.stackingLayerAbove(undefined, 1070)).toBe(1070)
    expect(() => nativeLeg.AdaptiveWebPopoverContentCompat()).toThrow(/web-only/)
  })
})

describe('popover exclusions ledger', () => {
  it('stays non-empty and documented (no silent deltas)', () => {
    expect(POPOVER_PARITY_EXCLUSIONS.length).toBeGreaterThan(0)
    for (const exclusion of POPOVER_PARITY_EXCLUSIONS) {
      expect(exclusion.reason.length).toBeGreaterThan(20)
      expect(exclusion.standIn.length).toBeGreaterThan(20)
    }
  })

  it('flags the gated sheet deferral prominently', () => {
    const sheet = POPOVER_PARITY_EXCLUSIONS.find((entry) => entry.area.includes('Sheet adaptation'))
    expect(sheet?.area).toContain('GATED DEFERRAL')
  })
})
