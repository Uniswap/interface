import * as DialogPrimitive from '@radix-ui/react-dialog'
import { fireEvent, render, waitFor } from '@testing-library/react'
import * as React from 'react'
import { markRadixEscapePreventedBySheet } from 'utilities/src/react/useSheetEscapeToClose'
import { describe, expect, it, vi } from 'vitest'
import type { WebBottomSheetCompatProps } from '../popover-compat/props'
import { EffectiveOverlayZIndexContext } from '../popover-compat/z-index'
import { getPercentSnapHeight, getSheetHeightStyles, SHEET_ANIMATION_DURATION, stripConsumerHeight } from './internals'
import { WEB_BOTTOM_SHEET_OVERLAY_TEST_ID, type WebBottomSheetProps } from './props'
import { WebBottomSheet } from './WebBottomSheet'

function dispatchEscape(prepare?: (event: KeyboardEvent) => void): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
  prepare?.(event)
  React.act(() => {
    // Dispatched on body (not document) so document-level CAPTURE listeners — Radix's
    // dismissable layers — run before the sheets' bubble-phase document listeners,
    // matching real key events targeted at the focused element.
    document.body.dispatchEvent(event)
  })
  return event
}

/** The scrim's own selector, off the id the shim exposes — never its styling class. */
const OVERLAY = `[data-testid="${WEB_BOTTOM_SHEET_OVERLAY_TEST_ID}"]`

/** A full press as browsers deliver it — mouse and touch taps both end in a click on the target. */
function pressElement(element: Element, pointerType: 'mouse' | 'touch'): void {
  fireEvent.pointerDown(element, { button: 0, pointerType })
  fireEvent.pointerUp(element, { button: 0, pointerType })
  fireEvent.click(element, { button: 0, detail: 1 })
}

async function waitForOpenOverlay(): Promise<Element> {
  return waitFor(() => {
    const overlay = document.querySelector(`${OVERLAY}[data-state="open"]`)
    expect(overlay).not.toBeNull()
    return overlay as Element
  })
}

/**
 * The open sheet's scrim, read synchronously. Used by the fake-timer case below, where a
 * real-timer `waitFor` would poll against a clock that no longer advances on its own.
 */
function getOpenOverlay(): Element {
  const overlay = document.querySelector(`${OVERLAY}[data-state="open"]`)
  expect(overlay).not.toBeNull()
  return overlay as Element
}

describe('WebBottomSheet compat', () => {
  it('force-mounts children while closed (Tamagui Sheet parity) with hidden closed-state chrome', () => {
    render(
      <WebBottomSheet isOpen={false}>
        <span data-testid="sheet-child">child</span>
      </WebBottomSheet>,
    )
    expect(document.querySelector('[data-testid="sheet-child"]')).not.toBeNull()
    expect(document.querySelector('.mc-sheet-frame')?.getAttribute('data-state')).toBe('closed')
    expect(document.querySelector(OVERLAY)?.getAttribute('data-state')).toBe('closed')
  })

  it('marks frame and overlay open and injects the sheet stylesheet', () => {
    render(
      <WebBottomSheet isOpen onClose={vi.fn()}>
        <span>content</span>
      </WebBottomSheet>,
    )
    expect(document.querySelector('.mc-sheet-frame')?.getAttribute('data-state')).toBe('open')
    expect(document.querySelector(OVERLAY)?.getAttribute('data-state')).toBe('open')
    expect(document.getElementById('mycelium-web-bottom-sheet-styles')).not.toBeNull()
    expect(document.querySelector('[data-sheet-handle]')).not.toBeNull()
  })

  // Fake timers are load-bearing, not stylistic: the pre-arm assertion is only true inside the
  // SHEET_ANIMATION_DURATION window that the component's own `setTimeout` opens at mount. On real
  // timers a loaded CI runner can burn all 200ms in `render` + a polling `waitFor`, so the scrim is
  // already armed when the first press lands and the sheet dismisses early. Freezing the clock
  // makes "before armed" hold by construction instead of by luck.
  it('dismisses on a scrim press once the open animation delay has armed it', async () => {
    vi.useFakeTimers()
    try {
      const onClose = vi.fn()
      render(
        <WebBottomSheet isOpen onClose={onClose}>
          <span>content</span>
        </WebBottomSheet>,
      )
      const overlay = getOpenOverlay()
      // The same tap that opens the sheet must not dismiss it: presses are ignored until the
      // open animation completes (SHEET_ANIMATION_DURATION).
      pressElement(overlay, 'mouse')
      expect(onClose).not.toHaveBeenCalled()
      await React.act(async () => {
        await vi.advanceTimersByTimeAsync(SHEET_ANIMATION_DURATION)
      })
      pressElement(overlay, 'mouse')
      expect(onClose).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  // SWAP-3262: dismissal must not ride Radix's outside-pointer detection — its touch branch
  // needs a document-level click the scrim's stopPropagation intercepts.
  //
  // Caveat: this does not discriminate the underlying touch-click-deferral bug — it passes
  // identically against the pre-fix and post-fix component, since jsdom's PointerEvent/event
  // dispatch doesn't reproduce the touch-vs-deferred-click sequencing Radix's non-modal
  // DismissableLayer relies on (same is true of #40809's equivalent jsdom test). Kept for its
  // scrim-to-onClose wiring coverage, not as regression proof for this bug — that comes from
  // the e2e test instead.
  it('dismisses on a touch tap on its own scrim', async () => {
    const onClose = vi.fn()
    render(
      <WebBottomSheet isOpen onClose={onClose}>
        <span>content</span>
      </WebBottomSheet>,
    )
    const overlay = await waitForOpenOverlay()
    await React.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250))
    })
    pressElement(overlay, 'touch')
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  // SWAP-3262: coexisting force-mounted closed sheets preventDefault Radix's outside events,
  // vetoing the open sheet's layer — scrim presses must dismiss regardless.
  it('dismisses on a scrim press despite later-mounted closed sheets (force-mounted layers)', async () => {
    const onClose = vi.fn()
    render(
      <>
        <WebBottomSheet isOpen onClose={onClose}>
          <span>open sheet</span>
        </WebBottomSheet>
        <WebBottomSheet isOpen={false} onClose={vi.fn()}>
          <span>closed sheet mounted later</span>
        </WebBottomSheet>
      </>,
    )
    await waitFor(() => expect(document.querySelectorAll(OVERLAY).length).toBe(2))
    const overlay = await waitForOpenOverlay()
    await React.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250))
    })
    pressElement(overlay, 'touch')
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('omits the handlebar when hideHandlebar is set', () => {
    render(
      <WebBottomSheet isOpen hideHandlebar>
        <span>content</span>
      </WebBottomSheet>,
    )
    expect(document.querySelector('[data-sheet-handle]')).toBeNull()
  })

  it('closes on Escape only while open', () => {
    const onClose = vi.fn()
    const { rerender } = render(
      <WebBottomSheet isOpen={false} onClose={onClose}>
        <span>content</span>
      </WebBottomSheet>,
    )
    dispatchEscape()
    expect(onClose).not.toHaveBeenCalled()

    rerender(
      <WebBottomSheet isOpen onClose={onClose}>
        <span>content</span>
      </WebBottomSheet>,
    )
    dispatchEscape()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes only the top of the open-sheet stack on Escape', () => {
    const onCloseBottom = vi.fn()
    const onCloseTop = vi.fn()
    render(
      <>
        <WebBottomSheet isOpen onClose={onCloseBottom}>
          <span>bottom</span>
        </WebBottomSheet>
        <WebBottomSheet isOpen onClose={onCloseTop}>
          <span>top</span>
        </WebBottomSheet>
      </>,
    )
    dispatchEscape()
    expect(onCloseTop).toHaveBeenCalledTimes(1)
    expect(onCloseBottom).not.toHaveBeenCalled()
  })

  it('still closes when sheet chrome itself preventDefaulted the Escape (closed higher sheet layer)', () => {
    const onClose = vi.fn()
    render(
      <WebBottomSheet isOpen onClose={onClose}>
        <span>content</span>
      </WebBottomSheet>,
    )
    // A closed force-mounted layer's Radix escape path marks the event via sheet chrome:
    // the open sheet must still close.
    dispatchEscape((event) => markRadixEscapePreventedBySheet(event))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('defers Escape to a real inner Radix layer instead of also closing', async () => {
    const sheetOnClose = vi.fn()
    const dialogOnOpenChange = vi.fn()
    function Host({ dialogOpen }: { dialogOpen: boolean }): React.JSX.Element {
      return (
        <>
          <WebBottomSheet isOpen onClose={sheetOnClose}>
            <span>outer sheet body</span>
          </WebBottomSheet>
          {/* Mounted after the sheet => the highest Radix layer, like a context menu / dialog
              opened from inside the sheet. Radix dispatches Escape only to it; the sheet's own
              listener must treat that as consumed instead of also closing. */}
          <DialogPrimitive.Root open={dialogOpen} onOpenChange={dialogOnOpenChange}>
            <DialogPrimitive.Portal>
              <DialogPrimitive.Content aria-describedby={undefined}>
                <DialogPrimitive.Title>inner dialog</DialogPrimitive.Title>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>
        </>
      )
    }
    // The sheet settles first (its WEB-6258 gate defers a paint), THEN the inner layer opens —
    // matching real usage, where menus/dialogs inside an open sheet register later and higher.
    const { rerender } = render(<Host dialogOpen={false} />)
    await waitFor(() => expect(document.querySelector('.mc-sheet-frame')).not.toBeNull())
    rerender(<Host dialogOpen />)
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull())
    dispatchEscape()
    await waitFor(() => expect(dialogOnOpenChange).toHaveBeenCalledWith(false))
    expect(sheetOnClose).not.toHaveBeenCalled()
  })

  it('ignores IME composition-cancel Escapes', () => {
    const onClose = vi.fn()
    render(
      <WebBottomSheet isOpen onClose={onClose}>
        <span>ime sheet body</span>
      </WebBottomSheet>,
    )
    dispatchEscape()
    expect(onClose).toHaveBeenCalledTimes(1)
    dispatchEscape((event) => {
      Object.defineProperty(event, 'isComposing', { value: true })
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders the percent snap-point shape end to end (the webBottomSheetProps contract)', () => {
    // The NetworkFilterV2 call-site shape. The inline 60dvh itself is pinned by the
    // getPercentSnapHeight/getSheetHeightStyles unit tests below — jsdom's CSSOM drops dvh
    // values, so the DOM style property cannot be asserted here (same caveat as the legacy
    // ui/src sheet tests).
    render(
      <WebBottomSheet isOpen snapPointsMode="percent" snapPoints={[60]} onClose={vi.fn()}>
        <span>content</span>
      </WebBottomSheet>,
    )
    expect(document.querySelector('.mc-sheet-frame')?.getAttribute('data-state')).toBe('open')
  })

  it('locks and restores root scroll while open', () => {
    const { rerender, unmount } = render(
      <WebBottomSheet isOpen>
        <span>content</span>
      </WebBottomSheet>,
    )
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.documentElement.style.scrollbarGutter).toBe('stable')
    rerender(
      <WebBottomSheet isOpen={false}>
        <span>content</span>
      </WebBottomSheet>,
    )
    expect(document.documentElement.style.overflow).toBe('')
    unmount()
  })

  it('skips the scroll lock for self-locking callers (disableRemoveScroll)', () => {
    render(
      <WebBottomSheet isOpen disableRemoveScroll>
        <span>content</span>
      </WebBottomSheet>,
    )
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('resolves a $zIndex token to the same layer the frame renders (no frame-behind-scrim split)', () => {
    let seen: number | undefined
    function Probe(): null {
      seen = React.useContext(EffectiveOverlayZIndexContext)
      return null
    }
    render(
      <WebBottomSheet isOpen zIndex="$overlay">
        <Probe />
      </WebBottomSheet>,
    )
    // Literal deliberately not derived through zIndexValue(): $overlay's layer
    // number per ui/src/theme/zIndexes.ts (and the popover-compat mirror).
    expect(seen).toBe(100010)
  })

  it('a numeric zIndex seeds the stacking context unchanged', () => {
    let seen: number | undefined
    function Probe(): null {
      seen = React.useContext(EffectiveOverlayZIndexContext)
      return null
    }
    render(
      <WebBottomSheet isOpen zIndex={1234}>
        <Probe />
      </WebBottomSheet>,
    )
    expect(seen).toBe(1234)
  })

  it('appends a consumer className to the frame emission classes (the FlexCompat merge norm)', () => {
    render(
      <WebBottomSheet isOpen className="consumer-probe">
        <span>content</span>
      </WebBottomSheet>,
    )
    const frame = document.querySelector('.mc-sheet-frame') as HTMLElement
    // Rides the emission (composeCompatEmission appends props.className), not a literal override.
    expect(frame.classList.contains('consumer-probe')).toBe(true)
    // Frame-only: the sheet's own chrome nodes never receive consumer classes.
    expect(document.querySelector(OVERLAY)?.classList.contains('consumer-probe')).toBe(false)
  })

  it('pads the content scroller by --mweb-bottom-inset regardless of the frame pb', () => {
    render(
      <WebBottomSheet isOpen pb="$spacing24">
        <span>inset</span>
      </WebBottomSheet>,
    )
    const frame = document.querySelector('.mc-sheet-frame') as HTMLElement
    const content = frame.querySelector('[data-sheet-content]') as HTMLElement
    expect(frame.classList.contains('pb-[24px]')).toBe(true)
    expect(content.classList.contains('pb-[var(--c-pb)]')).toBe(true)
    expect(content.style.getPropertyValue('--c-pb')).toBe('var(--mweb-bottom-inset, 0px)')
  })

  it('accepts the popover-compat webBottomSheetProps call-site shape', () => {
    // Compile-time coverage: the NetworkFilterV2-style call site
    // (`webBottomSheetProps={{ onClose, snapPoints: [60], snapPointsMode: 'percent' }}`)
    // must be assignable onto this component once `isOpen` is added.
    const compat: WebBottomSheetCompatProps = {
      onClose: (): void => {},
      snapPoints: [60],
      snapPointsMode: 'percent',
    }
    const props: WebBottomSheetProps = { ...compat, isOpen: true }
    expect(props.snapPointsMode).toBe('percent')
  })
})

describe('sheet sizing internals', () => {
  it('derives percent snap heights from numbers and percent strings, else undefined', () => {
    expect(getPercentSnapHeight([60])).toBe('60dvh')
    expect(getPercentSnapHeight(['85%'])).toBe('85dvh')
    expect(getPercentSnapHeight(['fit'])).toBeUndefined()
    expect(getPercentSnapHeight([])).toBeUndefined()
    expect(getPercentSnapHeight(null)).toBeUndefined()
  })

  it('strips consumer height plumbing (top-level and $md.$platform-web)', () => {
    const stripped = stripConsumerHeight({
      height: '100vh',
      maxHeight: 400,
      $md: { '$platform-web': { height: '100vh', maxHeight: '90vh' } },
    })
    expect(stripped.height).toBeUndefined()
    expect(stripped.maxHeight).toBe(400)
    expect((stripped.$md as { '$platform-web': Record<string, unknown> })['$platform-web']).toEqual({
      maxHeight: '90vh',
    })
  })

  it('caps fit-mode height to the viewport minus the interface nav on the web app', () => {
    expect(
      getSheetHeightStyles({
        snapPointsMode: 'fit',
        isWebApp: true,
        interfaceNavHeight: 72,
      }),
    ).toEqual({ height: undefined, maxHeight: 'calc(100vh - 72px)' })
    expect(
      getSheetHeightStyles({
        snapPointsMode: 'percent',
        snapPoints: [60],
        isWebApp: true,
        interfaceNavHeight: 72,
      }),
    ).toEqual({ height: '60dvh', maxHeight: '100dvh' })
  })
})
