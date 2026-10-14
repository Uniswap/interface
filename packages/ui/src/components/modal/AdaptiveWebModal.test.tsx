import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { useContext, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

// expo-blur is a transitive dep of TouchableArea / Modal.native and ships JSX in a
// `.js` file that Vite refuses to parse. The hook under test doesn't render any UI,
// but the import graph still touches it through Tamagui.
vi.mock('expo-blur', () => ({
  BlurView: () => null,
}))

import {
  ADAPTIVE_MODAL_ANIMATION_DURATION,
  AdaptiveWebModal,
  EffectiveModalOrSheetZIndexContext,
  ModalCloseIcon,
  useEffectiveModalOrSheetZIndex,
  WEB_BOTTOM_SHEET_OVERLAY_TEST_ID,
  WebBottomSheet,
  WebModalWithBottomAttachment,
} from 'ui/src/components/modal/AdaptiveWebModal'
import type { SheetFitHeight } from 'ui/src/components/modal/AdaptiveWebModalShared'
import { SharedUIUniswapProvider } from 'ui/src/test/render'
import { zIndexes } from 'ui/src/theme'

/** The sheet scrim's own selector, off the id the sheet exposes — never its styling class. */
const SHEET_OVERLAY = `[data-testid="${WEB_BOTTOM_SHEET_OVERLAY_TEST_ID}"]`

const withParentContext =
  (value: number | undefined) =>
  ({ children }: PropsWithChildren): JSX.Element => (
    <EffectiveModalOrSheetZIndexContext.Provider value={value}>{children}</EffectiveModalOrSheetZIndexContext.Provider>
  )

describe('useEffectiveModalOrSheetZIndex', () => {
  it('returns zIndexes.modal as floor when no parent context and no explicit zIndex (dialog branch)', () => {
    const { result } = renderHook(() =>
      useEffectiveModalOrSheetZIndex({ adaptToSheet: false, isTopAligned: true, zIndex: undefined }),
    )
    expect(result.current).toBe(zIndexes.modal)
  })

  it('honors explicit zIndex when provided, ignoring parent context', () => {
    const { result } = renderHook(
      () => useEffectiveModalOrSheetZIndex({ adaptToSheet: false, isTopAligned: true, zIndex: 50000 }),
      { wrapper: withParentContext(zIndexes.overlay) },
    )
    expect(result.current).toBe(50000)
  })

  it('stacks one layer above parent context when context is set and no explicit zIndex (the dapp-request case)', () => {
    const { result } = renderHook(
      () => useEffectiveModalOrSheetZIndex({ adaptToSheet: false, isTopAligned: true, zIndex: undefined }),
      { wrapper: withParentContext(zIndexes.overlay) },
    )
    expect(result.current).toBe(zIndexes.overlay + 1)
  })

  it('floors at zIndexes.modal when parent context is below the floor', () => {
    const { result } = renderHook(
      () => useEffectiveModalOrSheetZIndex({ adaptToSheet: false, isTopAligned: true, zIndex: undefined }),
      { wrapper: withParentContext(100) },
    )
    expect(result.current).toBe(zIndexes.modal)
  })
})

describe('AdaptiveWebModal (web dialog branch)', () => {
  // The vitest matchMedia mock always reports `matches: false`, so the md sheet-adapt branch
  // never activates here and these tests exercise the dialog rendering path.
  it('portals children with dialog semantics and presence state when open', () => {
    render(
      <AdaptiveWebModal isOpen data-testid="test-modal" onClose={vi.fn()}>
        <span>modal body</span>
      </AdaptiveWebModal>,
      { wrapper: SharedUIUniswapProvider },
    )

    expect(screen.getByText('modal body')).toBeDefined()
    const content = document.querySelector('[role="dialog"]')
    expect(content).not.toBeNull()
    expect(content?.getAttribute('data-state')).toBe('open')
    expect(content?.classList.contains('uw-modal-content-center')).toBe(true)
    expect(content?.getAttribute('data-testid')).toBe('test-modal')
    expect(document.querySelector('.uw-modal-overlay')).not.toBeNull()
  })

  it('uses the top-aligned enter/exit animation class for alignment="top"', () => {
    render(
      <AdaptiveWebModal isOpen alignment="top" onClose={vi.fn()}>
        <span>top body</span>
      </AdaptiveWebModal>,
      { wrapper: SharedUIUniswapProvider },
    )
    expect(document.querySelector('[role="dialog"]')?.classList.contains('uw-modal-content-top')).toBe(true)
  })

  it('renders nothing while closed', () => {
    render(
      <AdaptiveWebModal isOpen={false} onClose={vi.fn()}>
        <span>hidden body</span>
      </AdaptiveWebModal>,
      { wrapper: SharedUIUniswapProvider },
    )
    expect(screen.queryByText('hidden body')).toBeNull()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('calls onClose on Escape', async () => {
    const onClose = vi.fn()
    render(
      <AdaptiveWebModal isOpen onClose={onClose}>
        <span>esc body</span>
      </AdaptiveWebModal>,
      { wrapper: SharedUIUniswapProvider },
    )
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('provides the bumped z-index context to children', () => {
    let seen: number | undefined
    function Probe(): null {
      seen = useContext(EffectiveModalOrSheetZIndexContext)
      return null
    }
    render(
      <AdaptiveWebModal isOpen onClose={vi.fn()}>
        <Probe />
      </AdaptiveWebModal>,
      { wrapper: SharedUIUniswapProvider },
    )
    expect(seen).toBe(zIndexes.modal)
  })
})

describe('WebBottomSheet (web)', () => {
  it('a consumer-passed height prop does not defeat fit-mode content sizing', async () => {
    // The token-selector shape: Modal.web forwards fullScreen height both top-level and via
    // $md.$platform-web. Tamagui compiles height props into CLASSES on the frame, which an
    // inline `height: undefined` cannot override — fit mode must strip them entirely
    // (old Tamagui Sheet parity: fit mode ignored consumer height and sized to content).
    render(
      <WebBottomSheet
        isOpen
        height="100vh"
        $md={{ '$platform-web': { height: '100vh', maxHeight: 'calc(100dvh - 72px)' } }}
        onClose={vi.fn()}
      >
        <span>fit body</span>
      </WebBottomSheet>,
      { wrapper: SharedUIUniswapProvider },
    )
    const frame = await waitFor(() => {
      const node = document.querySelector('.uw-sheet-frame')
      expect(node).not.toBeNull()
      return node as HTMLElement
    })
    expect([...frame.classList].filter((cls) => cls.startsWith('_height-'))).toEqual([])
    expect(frame.style.height).not.toBe('100vh')
  })

  it('renders frame, handlebar, and children with presence state when open', async () => {
    render(
      <WebBottomSheet isOpen onClose={vi.fn()}>
        <span>sheet body</span>
      </WebBottomSheet>,
      { wrapper: SharedUIUniswapProvider },
    )
    await waitFor(() => expect(screen.getByText('sheet body')).toBeDefined())
    const frame = document.querySelector('.uw-sheet-frame')
    expect(frame).not.toBeNull()
    expect(frame?.getAttribute('data-state')).toBe('open')
    expect(document.querySelector('[data-sheet-handle]')).not.toBeNull()
    expect(document.querySelector(SHEET_OVERLAY)).not.toBeNull()
  })

  it('hides the handlebar when hideHandlebar is set', async () => {
    render(
      <WebBottomSheet isOpen hideHandlebar onClose={vi.fn()}>
        <span>no handle</span>
      </WebBottomSheet>,
      { wrapper: SharedUIUniswapProvider },
    )
    await waitFor(() => expect(screen.getByText('no handle')).toBeDefined())
    expect(document.querySelector('[data-sheet-handle]')).toBeNull()
  })

  // INFRA-4019: Tamagui overwrote the frame's `px` default with a consumer padding prop spread
  // after it. Mycelium emits `p-[0px]` and `px-[8px]` into different tailwind-merge groups, so
  // the default used to survive and inset every row by 8px per side.
  describe('frame horizontal padding precedence', () => {
    async function frameClasses(ui: JSX.Element): Promise<string[]> {
      render(ui, { wrapper: SharedUIUniswapProvider })
      await waitFor(() => expect(document.querySelector('.uw-sheet-frame')).not.toBeNull())
      return Array.from(document.querySelector('.uw-sheet-frame')?.classList ?? []).filter((className) =>
        /^(p|px|pl|pr)-/.test(className),
      )
    }

    it('applies the $spacing8 default when the consumer sets no padding', async () => {
      const classes = await frameClasses(
        <WebBottomSheet isOpen onClose={vi.fn()}>
          <span>default padding</span>
        </WebBottomSheet>,
      )
      expect(classes).toContain('px-[8px]')
    })

    it("lets a consumer `p` win over the default, as NavDropdown's `p={0}` relies on", async () => {
      const classes = await frameClasses(
        <WebBottomSheet isOpen p={0} onClose={vi.fn()}>
          <span>zero padding</span>
        </WebBottomSheet>,
      )
      expect(classes).toContain('px-[0px]')
      expect(classes).not.toContain('px-[8px]')
    })

    it('lets a consumer `px` win over the default', async () => {
      const classes = await frameClasses(
        <WebBottomSheet isOpen px="$spacing24" onClose={vi.fn()}>
          <span>wide padding</span>
        </WebBottomSheet>,
      )
      expect(classes).toContain('px-[24px]')
      expect(classes).not.toContain('px-[8px]')
    })
  })

  it('keeps children mounted with closed presence state while closed (Tamagui Sheet parity)', async () => {
    render(
      <WebBottomSheet isOpen={false} onClose={vi.fn()}>
        <span>closed sheet</span>
      </WebBottomSheet>,
      { wrapper: SharedUIUniswapProvider },
    )
    // Wait out the WEB-6258 first-mount deferral before asserting
    await waitFor(() => expect(document.querySelector('.uw-sheet-frame')).not.toBeNull())
    expect(document.querySelector('.uw-sheet-frame')?.getAttribute('data-state')).toBe('closed')
    expect(screen.getByText('closed sheet')).toBeDefined()
  })

  it('does not call onClose for dismiss gestures while closed', async () => {
    const onClose = vi.fn()
    render(
      <WebBottomSheet isOpen={false} onClose={onClose}>
        <span>closed sheet</span>
      </WebBottomSheet>,
      { wrapper: SharedUIUniswapProvider },
    )
    await waitFor(() => expect(document.querySelector('.uw-sheet-frame')).not.toBeNull())
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('AdaptiveWebModal dismissal semantics (web dialog branch)', () => {
  async function waitForOutsideListeners(): Promise<void> {
    // Radix's pointer-down-outside listener attaches in a timeout(0) after mount.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
  }

  it('dismisses on a pointer press on its own scrim', async () => {
    const onClose = vi.fn()
    render(
      <AdaptiveWebModal isOpen onClose={onClose}>
        <span>body</span>
      </AdaptiveWebModal>,
      { wrapper: SharedUIUniswapProvider },
    )
    await waitForOutsideListeners()
    const overlay = document.querySelector('.uw-modal-overlay')
    expect(overlay).not.toBeNull()
    fireEvent.pointerDown(overlay as Element, { button: 0 })
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('does not dismiss on a press on a sibling-portaled element (dropdown portaled to body)', async () => {
    const onClose = vi.fn()
    // Simulates a dropdown/tooltip portaled to document.body while the modal is open — the exact
    // interaction Tamagui's Dialog tolerated and this rebuild must keep tolerating.
    const sibling = document.createElement('div')
    sibling.textContent = 'portaled dropdown option'
    document.body.appendChild(sibling)
    try {
      render(
        <AdaptiveWebModal isOpen onClose={onClose}>
          <span>body</span>
        </AdaptiveWebModal>,
        { wrapper: SharedUIUniswapProvider },
      )
      await waitForOutsideListeners()
      fireEvent.pointerDown(sibling, { button: 0 })
      await waitForOutsideListeners()
      expect(onClose).not.toHaveBeenCalled()
    } finally {
      sibling.remove()
    }
  })

  it('traps focus inside the open dialog and restores it to the trigger on close', async () => {
    function Host(): JSX.Element {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button data-testid="trigger" type="button" onClick={() => setOpen(true)}>
            open
          </button>
          <button data-testid="bystander" type="button">
            bystander
          </button>
          <AdaptiveWebModal isOpen={open} onClose={() => setOpen(false)}>
            <button data-testid="inside" type="button">
              inside
            </button>
          </AdaptiveWebModal>
        </>
      )
    }
    render(<Host />, { wrapper: SharedUIUniswapProvider })

    const trigger = screen.getByTestId('trigger')
    trigger.focus()
    fireEvent.click(trigger)

    // Focus moves into the dialog on open
    const content = await waitFor(() => {
      const node = document.querySelector('[role="dialog"]')
      expect(node).not.toBeNull()
      return node as HTMLElement
    })
    await waitFor(() => expect(content.contains(document.activeElement)).toBe(true))

    // Trapped: programmatically focusing an outside element is pulled back into the dialog
    screen.getByTestId('bystander').focus()
    await waitFor(() => expect(content.contains(document.activeElement)).toBe(true))

    // Restored: closing hands focus back to the element focused before open
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull())
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })
})

describe('WebBottomSheet dismissal semantics (web)', () => {
  /** A full press as browsers deliver it — mouse and touch taps both end in a click on the target. */
  function pressElement(element: Element, pointerType: 'mouse' | 'touch'): void {
    fireEvent.pointerDown(element, { button: 0, pointerType })
    fireEvent.pointerUp(element, { button: 0, pointerType })
    fireEvent.click(element, { button: 0, detail: 1 })
  }

  async function waitForOverlay(): Promise<Element> {
    return waitFor(() => {
      const node = [...document.querySelectorAll(SHEET_OVERLAY)].find(
        (overlay) => overlay.getAttribute('data-state') === 'open',
      )
      expect(node).toBeDefined()
      return node as Element
    })
  }

  /**
   * The open sheet's scrim, read synchronously. Used by the fake-timer case below, where a
   * real-timer `waitFor` would poll against a clock that no longer advances on its own.
   */
  function getOpenOverlay(): Element {
    const node = [...document.querySelectorAll(SHEET_OVERLAY)].find(
      (overlay) => overlay.getAttribute('data-state') === 'open',
    )
    expect(node).toBeDefined()
    return node as Element
  }

  // Fake timers are load-bearing, not stylistic: the pre-arm assertion is only true inside the
  // ADAPTIVE_MODAL_ANIMATION_DURATION window that the component's own `setTimeout` opens at mount.
  // On real timers a loaded CI runner can burn all 200ms in `render` + a polling `waitFor`, so the
  // scrim is already armed when the first press lands and the sheet dismisses early. Freezing the
  // clock makes "before armed" hold by construction instead of by luck.
  it('dismisses on a scrim press once the open animation delay has armed it', async () => {
    vi.useFakeTimers()
    try {
      const onClose = vi.fn()
      render(
        <WebBottomSheet isOpen onClose={onClose}>
          <span>sheet body</span>
        </WebBottomSheet>,
        { wrapper: SharedUIUniswapProvider },
      )
      const overlay = getOpenOverlay()
      // The same tap that opens the sheet must not dismiss it: presses are ignored until the
      // open animation completes (ADAPTIVE_MODAL_ANIMATION_DURATION).
      pressElement(overlay, 'mouse')
      expect(onClose).not.toHaveBeenCalled()
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ADAPTIVE_MODAL_ANIMATION_DURATION)
      })
      pressElement(overlay, 'mouse')
      expect(onClose).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  // SWAP-3262: dismissal must not ride Radix's outside-pointer detection — its touch branch
  // needs a document-level click the scrim's stopPropagation intercepts.
  it('dismisses on a touch tap on its own scrim', async () => {
    const onClose = vi.fn()
    render(
      <WebBottomSheet isOpen onClose={onClose}>
        <span>sheet body</span>
      </WebBottomSheet>,
      { wrapper: SharedUIUniswapProvider },
    )
    const overlay = await waitForOverlay()
    await act(async () => {
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
      { wrapper: SharedUIUniswapProvider },
    )
    await waitFor(() => expect(document.querySelectorAll(SHEET_OVERLAY).length).toBe(2))
    const overlay = await waitForOverlay()
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250))
    })
    pressElement(overlay, 'touch')
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('does not dismiss on a press on a sibling-portaled element outside its scrim and frame', async () => {
    const onClose = vi.fn()
    const sibling = document.createElement('div')
    sibling.textContent = 'portaled dropdown option'
    document.body.appendChild(sibling)
    try {
      render(
        <WebBottomSheet isOpen onClose={onClose}>
          <span>sheet body</span>
        </WebBottomSheet>,
        { wrapper: SharedUIUniswapProvider },
      )
      await waitFor(() => expect(document.querySelector('.uw-sheet-frame')).not.toBeNull())
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 250))
      })
      fireEvent.pointerDown(sibling, { button: 0 })
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
      expect(onClose).not.toHaveBeenCalled()
    } finally {
      sibling.remove()
    }
  })
})

describe('WebModalWithBottomAttachment (web dialog branch)', () => {
  it('portals children and the bottom attachment with dialog semantics when open', () => {
    render(
      <WebModalWithBottomAttachment isOpen bottomAttachment={<span>attachment body</span>} onClose={vi.fn()}>
        <span>attachment modal body</span>
      </WebModalWithBottomAttachment>,
      { wrapper: SharedUIUniswapProvider },
    )
    expect(screen.getByText('attachment modal body')).toBeDefined()
    expect(screen.getByText('attachment body')).toBeDefined()
    const content = document.querySelector('[role="dialog"]')
    expect(content).not.toBeNull()
    expect(content?.getAttribute('data-state')).toBe('open')
    expect(content?.classList.contains('uw-attachment-content-center')).toBe(true)
    expect(document.querySelector('.uw-modal-overlay')).not.toBeNull()
  })

  it('calls onClose on Escape', async () => {
    const onClose = vi.fn()
    render(
      <WebModalWithBottomAttachment isOpen onClose={onClose}>
        <span>esc attachment body</span>
      </WebModalWithBottomAttachment>,
      { wrapper: SharedUIUniswapProvider },
    )
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('dismisses on a pointer press on its own scrim', async () => {
    const onClose = vi.fn()
    render(
      <WebModalWithBottomAttachment isOpen onClose={onClose}>
        <span>scrim attachment body</span>
      </WebModalWithBottomAttachment>,
      { wrapper: SharedUIUniswapProvider },
    )
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    const overlay = document.querySelector('.uw-modal-overlay')
    expect(overlay).not.toBeNull()
    fireEvent.pointerDown(overlay as Element, { button: 0 })
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('renders nothing while closed', () => {
    render(
      <WebModalWithBottomAttachment isOpen={false} onClose={vi.fn()}>
        <span>hidden attachment body</span>
      </WebModalWithBottomAttachment>,
      { wrapper: SharedUIUniswapProvider },
    )
    expect(screen.queryByText('hidden attachment body')).toBeNull()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })
})

describe('WebBottomSheet deferred first mount (WEB-6258 gate) still arms the frame hooks', () => {
  // Regression class from the deployed probe: the sheet renders null on first paint (the
  // WEB-6258 mounted gate), so the frame node arrives WITHOUT any hook dep changing. RefObject
  // reads inside the effects silently never re-ran — measure-at-open and drag-to-dismiss were
  // dead on every Modal-wrapped open (each open is a fresh mount). These render through the real
  // WebBottomSheet, so the frame does not exist when the hooks first run — the earlier unit
  // harnesses mounted the frame immediately, which was exactly the blind spot.
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('measure-at-open freeze engages on a fresh open through the deferred mount', async () => {
    const original = HTMLElement.prototype.getBoundingClientRect
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement): DOMRect {
      if (this.classList.contains('uw-sheet-frame')) {
        return { height: 528 } as DOMRect
      }
      return original.call(this)
    })
    render(
      <WebBottomSheet isOpen onClose={vi.fn()}>
        <span>fresh open body</span>
      </WebBottomSheet>,
      { wrapper: SharedUIUniswapProvider },
    )
    const frame = await waitFor(() => {
      const node = document.querySelector('.uw-sheet-frame') as HTMLElement | null
      expect(node).not.toBeNull()
      return node as HTMLElement
    })
    // jsdom has no ResizeObserver, so this exercises the single-measure fallback leg — the
    // deferred-mount ARMING (state node feeding the effect) is the shared mechanism under test.
    await waitFor(() => expect(frame.style.minHeight).toBe('528px'))
  })

  it('drag-to-dismiss attaches on a fresh open through the deferred mount', async () => {
    vi.spyOn(performance, 'now').mockImplementation(() => 1_000)
    render(
      <WebBottomSheet isOpen onClose={vi.fn()}>
        <span>fresh drag body</span>
      </WebBottomSheet>,
      { wrapper: SharedUIUniswapProvider },
    )
    const handle = await waitFor(() => {
      const node = document.querySelector('[data-sheet-handle]') as HTMLElement | null
      expect(node).not.toBeNull()
      return node as HTMLElement
    })
    const frame = document.querySelector('.uw-sheet-frame') as HTMLElement
    handle.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true, clientY: 100, button: 0 }))
    window.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, cancelable: true, clientY: 160, button: 0 }))
    await waitFor(() => expect(frame.style.transform).toBe('translateY(60px)'))
    window.dispatchEvent(new MouseEvent('pointercancel', { bubbles: true, cancelable: true, clientY: 160, button: 0 }))
  })
})

describe('WebBottomSheet Escape arbitration across coexisting instances (web)', () => {
  // The regression class the single-instance suite missed: force-mounted CLOSED sheets stay in
  // Radix's shared DismissableLayer stack, and Radix dispatches Escape only to the
  // highest-mounted layer — so a later-mounted closed sheet (MobileHeaderActions on PoolDetails)
  // would swallow Escape for an earlier-mounted OPEN sheet (the app-wide nav drawer). Escape is
  // therefore owned by an open-scoped listener with its own stack of OPEN sheets.
  it('Escape reaches the open sheet even when a closed sheet mounted later (higher Radix layer)', async () => {
    const openOnClose = vi.fn()
    const closedOnClose = vi.fn()
    render(
      <>
        {/* Mount order matters: the open sheet first (lower Radix layer index)… */}
        <WebBottomSheet isOpen onClose={openOnClose}>
          <span>nav drawer body</span>
        </WebBottomSheet>
        {/* …then the closed sheet, which Radix would consider the "highest" layer. */}
        <WebBottomSheet isOpen={false} onClose={closedOnClose}>
          <span>page actions body</span>
        </WebBottomSheet>
      </>,
      { wrapper: SharedUIUniswapProvider },
    )
    await waitFor(() => expect(document.querySelectorAll('.uw-sheet-frame')).toHaveLength(2))
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(openOnClose).toHaveBeenCalledTimes(1)
    expect(closedOnClose).not.toHaveBeenCalled()
  })

  it('with two OPEN sheets, Escape closes only the most recently opened one, then the next', async () => {
    const firstOnClose = vi.fn()
    const secondOnClose = vi.fn()
    function Host({ secondOpen }: { secondOpen: boolean }): JSX.Element {
      return (
        <>
          <WebBottomSheet isOpen onClose={firstOnClose}>
            <span>outer sheet</span>
          </WebBottomSheet>
          <WebBottomSheet isOpen={secondOpen} onClose={secondOnClose}>
            <span>nested sheet</span>
          </WebBottomSheet>
        </>
      )
    }
    const { rerender } = render(<Host secondOpen />, { wrapper: SharedUIUniswapProvider })
    await waitFor(() => expect(document.querySelectorAll('.uw-sheet-frame')).toHaveLength(2))

    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(secondOnClose).toHaveBeenCalledTimes(1)
    expect(firstOnClose).not.toHaveBeenCalled()

    // Once the top sheet actually closes, the remaining open sheet takes over Escape
    rerender(<Host secondOpen={false} />)
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(firstOnClose).toHaveBeenCalledTimes(1)
    expect(secondOnClose).toHaveBeenCalledTimes(1)
  })

  it('a single open sheet still closes on Escape', async () => {
    const onClose = vi.fn()
    render(
      <WebBottomSheet isOpen onClose={onClose}>
        <span>only sheet</span>
      </WebBottomSheet>,
      { wrapper: SharedUIUniswapProvider },
    )
    await waitFor(() => expect(document.querySelector('.uw-sheet-frame')).not.toBeNull())
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('WebBottomSheet fit height content mode', () => {
  type ROCallback = (
    entries: Array<{ borderBoxSize?: Array<{ blockSize: number; inlineSize: number }>; target: Element }>,
    observer: unknown,
  ) => void

  class MockResizeObserver {
    static instances: MockResizeObserver[] = []
    callback: ROCallback
    observed: Element[] = []
    constructor(callback: ROCallback) {
      this.callback = callback
      MockResizeObserver.instances.push(this)
    }
    observe(el: Element): void {
      this.observed.push(el)
    }
    unobserve(): void {}
    disconnect(): void {}
    report(height: number): void {
      this.callback(
        [{ borderBoxSize: [{ blockSize: height, inlineSize: 375 }], target: this.observed[0] as Element }],
        this,
      )
    }
  }

  beforeEach(() => {
    MockResizeObserver.instances = []
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function openFrame(
    props: { sheetFitHeight?: SheetFitHeight } = {},
  ): Promise<{ frame: HTMLElement; observer: MockResizeObserver | undefined }> {
    render(
      <WebBottomSheet isOpen sheetFitHeight={props.sheetFitHeight} onClose={vi.fn()}>
        <span>fit body</span>
      </WebBottomSheet>,
      { wrapper: SharedUIUniswapProvider },
    )
    const frame = await waitFor(() => {
      const node = document.querySelector('.uw-sheet-frame') as HTMLElement | null
      expect(node).not.toBeNull()
      return node as HTMLElement
    })
    return { frame, observer: MockResizeObserver.instances[MockResizeObserver.instances.length - 1] }
  }

  it('ratchet mode pins minHeight and keeps it when the layout shrinks', async () => {
    const { frame, observer } = await openFrame()
    expect(observer).toBeDefined()
    observer?.report(528)
    observer?.report(274)
    expect(frame.style.minHeight).toBe('528px')
  })

  it('content mode does not pin minHeight, so a later shrink is not frozen as blank space', async () => {
    const { frame } = await openFrame({ sheetFitHeight: 'content' })
    expect(MockResizeObserver.instances).toHaveLength(0)
    expect(frame.style.minHeight).toBe('')
    expect(frame.hasAttribute('sheetFitHeight')).toBe(false)
  })
})

describe('WebBottomSheet percent snap height (review finding 6)', () => {
  it('strips consumer $md height plumbing in percent mode (media classes would outrank the snap height)', async () => {
    render(
      // The SearchModal shape: percent snap + Modal.web's $md plumbing
      <WebBottomSheet
        isOpen
        snapPointsMode="percent"
        snapPoints={['85%']}
        $md={{ '$platform-web': { height: 'max-content', maxHeight: 'calc(100dvh - 72px)' } }}
        onClose={vi.fn()}
      >
        <span>percent body</span>
      </WebBottomSheet>,
      { wrapper: SharedUIUniswapProvider },
    )
    const frame = await waitFor(() => {
      const node = document.querySelector('.uw-sheet-frame') as HTMLElement | null
      expect(node).not.toBeNull()
      return node as HTMLElement
    })
    expect([...frame.classList].filter((cls) => cls.startsWith('_height-_md_'))).toEqual([])
    // The inline 85dvh itself is pinned by the getPercentFrameStyle unit tests — jsdom's CSSOM
    // drops dvh values, so the DOM style property cannot be asserted here.
  })
})

describe('WebBottomSheet Escape vs inner layers (review finding 7)', () => {
  it('one Escape closes only the top inner Radix layer, not the sheet beneath it', async () => {
    const sheetOnClose = vi.fn()
    const dialogOnClose = vi.fn()
    function Host({ dialogOpen }: { dialogOpen: boolean }): JSX.Element {
      return (
        <>
          <WebBottomSheet isOpen onClose={sheetOnClose}>
            <span>outer sheet body</span>
          </WebBottomSheet>
          {/* Mounted after the sheet => the highest Radix layer, like a context menu / dialog
              opened from inside the sheet. Radix dispatches Escape only to it; the sheet's own
              listener must treat that as consumed instead of also closing. */}
          <AdaptiveWebModal isOpen={dialogOpen} onClose={dialogOnClose}>
            <span>inner dialog body</span>
          </AdaptiveWebModal>
        </>
      )
    }
    // The sheet settles first (its WEB-6258 gate defers a paint), THEN the inner layer opens —
    // matching real usage, where menus/dialogs inside an open sheet register later and higher.
    const { rerender } = render(<Host dialogOpen={false} />, { wrapper: SharedUIUniswapProvider })
    await waitFor(() => expect(document.querySelector('.uw-sheet-frame')).not.toBeNull())
    rerender(<Host dialogOpen />)
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull())

    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    await waitFor(() => expect(dialogOnClose).toHaveBeenCalledTimes(1))
    expect(sheetOnClose).not.toHaveBeenCalled()
  })

  it('ignores IME composition-cancel Escapes', async () => {
    const onClose = vi.fn()
    render(
      <WebBottomSheet isOpen onClose={onClose}>
        <span>ime sheet body</span>
      </WebBottomSheet>,
      { wrapper: SharedUIUniswapProvider },
    )
    await waitFor(() => expect(document.querySelector('.uw-sheet-frame')).not.toBeNull())
    fireEvent.keyDown(document.body, { key: 'Escape', isComposing: true })
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('review-round regressions: scroll lock, scrim hit-testing, exit presence', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('locks html scroll while a sheet is open and releases it on unmount (finding 1)', async () => {
    const { unmount } = render(
      <WebBottomSheet isOpen onClose={vi.fn()}>
        <span>locked body</span>
      </WebBottomSheet>,
      { wrapper: SharedUIUniswapProvider },
    )
    // RemoveScroll locks documentElement overflow via the shared useDisableBodyScroll pool; the
    // wrapper must forward `enabled` or the lock silently no-ops.
    await waitFor(() => expect(document.documentElement.style.overflow).toBe('hidden'))
    unmount()
    await waitFor(() => expect(document.documentElement.style.overflow).not.toBe('hidden'))
  })

  it('locks html scroll while a dialog is open (finding 1)', async () => {
    const { unmount } = render(
      <AdaptiveWebModal isOpen onClose={vi.fn()}>
        <span>locked dialog body</span>
      </AdaptiveWebModal>,
      { wrapper: SharedUIUniswapProvider },
    )
    await waitFor(() => expect(document.documentElement.style.overflow).toBe('hidden'))
    unmount()
  })

  it('overlay and positioner opt back into pointer events under Radix modal mode (finding 2)', () => {
    render(
      <AdaptiveWebModal isOpen onClose={vi.fn()}>
        <span>hit-test body</span>
      </AdaptiveWebModal>,
      { wrapper: SharedUIUniswapProvider },
    )
    // Radix modal mode sets body pointer-events:none; the scrim/positioner must carry their own
    // pointer-events:auto or scrim-press dismissal is dead outside jsdom.
    const overlay = document.querySelector('.uw-modal-overlay') as HTMLElement
    const positioner = document.querySelector('.uw-modal-positioner') as HTMLElement
    expect(overlay).not.toBeNull()
    expect(positioner).not.toBeNull()
    // The scrim and positioner are mycelium Flex hosts, which emit `[pointer-events:auto]`.
    const hasPointerAuto = (el: HTMLElement): boolean =>
      el.style.pointerEvents === 'auto' || el.classList.contains('[pointer-events:auto]')
    expect(hasPointerAuto(overlay)).toBe(true)
    expect(hasPointerAuto(positioner)).toBe(true)
  })

  it('keeps the exiting dialog mounted until the positioner animation completes (finding 3)', async () => {
    // jsdom runs no CSS animations, so emulate the browser: report an animationName for our
    // animated chrome so Radix Presence waits, then deliver animationend by hand.
    // jsdom ships no CSS.escape; Radix's animationend matcher needs it.
    vi.stubGlobal('CSS', { escape: (value: string) => value })
    // Radix Presence captures the CSSStyleDeclaration ONCE at mount and re-reads animationName
    // from it later — in browsers that object is LIVE, so the emulation must be live too:
    // compute the name from the element's CURRENT data-state at property-read time.
    const originalGCS = window.getComputedStyle.bind(window)
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element, pseudo?: string | null) => {
      const style = originalGCS(el as HTMLElement, pseudo)
      if (!(el instanceof HTMLElement)) {
        return style
      }
      const liveAnimationName = (): string => {
        if (el.getAttribute('data-state') !== 'closed') {
          return 'none'
        }
        if (el.classList.contains('uw-modal-positioner')) {
          return 'uw-presence-hold'
        }
        if (el.classList.contains('uw-modal-content-center')) {
          return 'uw-modal-exit-down'
        }
        if (el.classList.contains('uw-modal-overlay')) {
          return 'uw-modal-fade-out'
        }
        return 'none'
      }
      return new Proxy(style, {
        get: (target, prop) => (prop === 'animationName' ? liveAnimationName() : Reflect.get(target, prop)),
      }) as CSSStyleDeclaration
    })

    function Host({ open }: { open: boolean }): JSX.Element {
      return (
        <AdaptiveWebModal isOpen={open} onClose={vi.fn()}>
          <span>exiting body</span>
        </AdaptiveWebModal>
      )
    }
    const { rerender } = render(<Host open />, { wrapper: SharedUIUniswapProvider })
    expect(screen.getByText('exiting body')).toBeDefined()

    rerender(<Host open={false} />)
    // Presence must keep the positioner (and the content inside it) mounted while the closed
    // animation plays — before the fix the positioner had no animation and unmounted instantly.
    expect(screen.queryByText('exiting body')).not.toBeNull()

    // Deliver the end of the exit animations; the tree may then unmount.
    act(() => {
      for (const [selector, animationName] of [
        ['.uw-modal-content-center', 'uw-modal-exit-down'],
        ['.uw-modal-positioner', 'uw-presence-hold'],
        ['.uw-modal-overlay', 'uw-modal-fade-out'],
      ] as const) {
        const node = document.querySelector(selector)
        if (node) {
          const event = new Event('animationend', { bubbles: false }) as AnimationEvent
          Object.defineProperty(event, 'animationName', { value: animationName })
          node.dispatchEvent(event)
        }
      }
    })
    await waitFor(() => expect(screen.queryByText('exiting body')).toBeNull())
  })
})

describe('ModalCloseIcon (web)', () => {
  it('renders the close icon outside the small-viewport web app case', () => {
    render(<ModalCloseIcon testId="close-icon" onClose={vi.fn()} />, { wrapper: SharedUIUniswapProvider })
    expect(screen.getByTestId('close-icon')).toBeDefined()
  })
})
