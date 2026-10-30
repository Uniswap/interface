/**
 * Web-only support machinery for the WebBottomSheet compat (see
 * `WebBottomSheet.web.tsx`). A Tamagui-free replica of the sheet half of
 * `ui/src/components/modal/AdaptiveWebModalInternals.web.tsx`, kept
 * behavior-identical so a conversion is an import-path swap; the legacy copy
 * is deleted when the last `ui/src` sheet consumer converts. Imported
 * exclusively from the `.web` leg — never resolved by native bundles.
 * (Escape handling is NOT duplicated here: both sheet families share the one
 * stack in `utilities/src/react/useSheetEscapeToClose`. Likewise the body
 * scroll lock: both families share the one refcount in
 * `utilities/src/react/useDisableBodyScroll`.)
 */
import { type CSSProperties, type MutableRefObject, useCallback, useEffect, useRef } from 'react'

const SHEET_STYLE_ELEMENT_ID = 'mycelium-web-bottom-sheet-styles'

/**
 * Enter/exit rules keyed off Radix's `data-state`, replicating the sheet legs
 * of the legacy modal stylesheet: overlay 'lazy' 500ms
 * cubic-bezier(0.25, 0.1, 0.25, 1); sheet '200ms' ease-in-out. Class and
 * keyframe names are `mc-` prefixed so the two stylesheets coexist without
 * rule collisions while both sheet families render in one app. The sheet is
 * force-mounted while closed, so 'closed' is a static hidden state —
 * transform/opacity here, transitions handle the exit leg — rather than an
 * exit keyframe, which would visibly play on every initial closed mount.
 * visibility flips after the exit transition so closed chrome is untabbable
 * without cutting the slide-out short. Only transform/opacity animate — never
 * color properties.
 */
const SHEET_CSS = `
@keyframes mc-sheet-fade-in { from { opacity: 0; } }
@keyframes mc-sheet-enter { from { transform: translateY(100%); } }
.mc-sheet-overlay[data-state='open'] { animation: mc-sheet-fade-in 500ms cubic-bezier(0.25, 0.1, 0.25, 1); }
.mc-sheet-frame[data-state='open'] { animation: mc-sheet-enter 200ms ease-in-out; }
.mc-sheet-overlay[data-state='closed'] { opacity: 0; pointer-events: none; visibility: hidden; transition: opacity 500ms cubic-bezier(0.25, 0.1, 0.25, 1), visibility 0s linear 500ms; }
.mc-sheet-frame[data-state='closed'] { transform: translateY(100%); pointer-events: none; visibility: hidden; transition: transform 200ms ease-in-out, visibility 0s linear 200ms; }
`

/** Inject via utilities' useInjectSingleStylesheet at the component top — a render-phase
 * document.head mutation here would violate render purity (StrictMode/concurrent renders). */
export const SHEET_STYLESHEET = { id: SHEET_STYLE_ELEMENT_ID, css: SHEET_CSS } as const

export const SHEET_ANIMATION_DURATION = 200

/** Mirror of `ui/src/theme/heights.ts` `INTERFACE_NAV_HEIGHT`; must stay in sync
 * until the constant moves into `@universe/tailwind` tokens. */
export const INTERFACE_NAV_HEIGHT = 72

export const VISUALLY_HIDDEN_STYLE: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
}

export const FIXED_FULL_SCREEN = { position: 'fixed' } as const

export type OutsideInteractionEvent = CustomEvent<{ originalEvent: PointerEvent | FocusEvent }>

export function getOutsideEventTarget(event: OutsideInteractionEvent): Node | null {
  const target = event.detail.originalEvent.target ?? event.target
  return target instanceof Node ? target : null
}

/**
 * Fit mode: consumer height plumbing must not defeat content-fit sizing — the old Tamagui Sheet
 * overrode any consumer height with its own measured height. Beyond the top-level `height` prop,
 * consumers also forward `$md={{ '$platform-web': { height } }}` (e.g. the token selector's
 * fullScreen `100vh`), which compiles into a media-scoped CLASS on the frame — an inline
 * `height: undefined` cannot override a class, so the keys must be stripped from the props before
 * they reach the frame. Everything else (padding, maxHeight, other `$md` styles) passes through
 * this strip — but the frame spreads its computed height styles after the consumer props (legacy
 * frame parity), so a top-level `maxHeight` is still overridden by the sheet's own viewport cap;
 * only `$md.$platform-web.maxHeight` feeds that cap, via getSheetHeightStyles' mdMaxHeight.
 */
export function stripConsumerHeight<T extends { height?: unknown; $md?: object }>(rest: T): T {
  // Percent mode strips too: the snap point owns the height there, and the consumer's
  // media-scoped $md height/maxHeight CLASSES would outrank the snap height (SearchModal's 85%
  // rendered ~93dvh; a snap-only sheet became content-sized). Fit-mode rationale above.
  const { height: _height, ...restSansHeight } = rest
  const md = rest.$md as Record<string, unknown> | undefined
  if (!md || typeof md['$platform-web'] !== 'object' || md['$platform-web'] === null) {
    return restSansHeight as unknown as T
  }
  const { height: _mdHeight, ...platformWebSansHeight } = md['$platform-web'] as Record<string, unknown>
  return {
    ...restSansHeight,
    $md: { ...md, '$platform-web': platformWebSansHeight },
  } as unknown as T
}

/**
 * Fit-mode frame height max-ratchet, replicating Tamagui Sheet's measured height behavior
 * (`SheetImplementationCustom.handleAnimationViewLayout` re-measured on every layout pass): while
 * the sheet is open, a ResizeObserver on the frame ratchets an inline `minHeight` up to the MAX
 * layout height reached so far, clamped to the viewport cap. The frame grows with initial content
 * layout and never shrinks. A single delayed measure is timing-fragile — it observes whatever
 * happened to be laid out at that instant — so the ratchet observes continuously and disconnects
 * only once the cap is reached.
 *
 * `minHeight` (not `height`) is load-bearing: an inline `height` pins layout at the FIRST report,
 * so the observer would never see the content-driven growth that follows; `minHeight` lets the
 * frame grow while forbidding shrink, which is the ratchet.
 *
 * Drag interplay: ResizeObserver reports the LAYOUT border-box, which `transform: translateY`
 * does not affect — drag-to-dismiss writes transforms to the same node without feeding the
 * ratchet. Closing keeps the last ratcheted height (stable during the exit slide); reopening
 * releases and re-ratchets. Percent mode is untouched. Environments without ResizeObserver
 * (jsdom) fall back to a single post-layout measure; the deployed preview is the parity ground
 * truth.
 */
export function useSheetFitHeightFreeze({
  isOpen,
  enabled,
  frame,
  isWebApp,
  interfaceNavHeight,
}: {
  isOpen: boolean
  enabled: boolean
  /** The frame NODE as state (from a callback ref), not a RefObject: consumers may gate mounting
   * a paint after the hooks first run, and a plain ref never re-fires the effect when the node
   * arrives — the ratchet must be armed by node arrival. */
  frame: HTMLDivElement | null
  isWebApp: boolean
  interfaceNavHeight: number
}): void {
  useEffect(() => {
    if (!enabled || !isOpen || !frame) {
      return undefined
    }
    // Fresh open: release the previous ratchet so this open re-measures from scratch.
    frame.style.minHeight = ''
    const cap = Math.max(0, isWebApp ? window.innerHeight - interfaceNavHeight : window.innerHeight)
    let maxHeight = 0
    /** Applies a measurement to the ratchet; returns true once the cap is reached (no further
     * growth is possible, so the caller can stop observing). */
    const ratchet = (measured: number): boolean => {
      const clamped = Math.min(measured, cap)
      if (clamped > maxHeight) {
        maxHeight = clamped
        frame.style.minHeight = `${maxHeight}px`
      }
      return maxHeight >= cap
    }
    if (typeof ResizeObserver === 'undefined') {
      const raf = requestAnimationFrame(() => {
        const measured = frame.getBoundingClientRect().height
        if (measured > 0) {
          ratchet(measured)
        }
      })
      return () => cancelAnimationFrame(raf)
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Typed non-optional in lib.dom, but absent on older engines (Safari 15.0-15.3): reading
        // .length there threw inside the RO callback and killed the ratchet.
        const boxes = entry.borderBoxSize as ResizeObserverSize[] | undefined
        const borderBox = boxes && boxes.length > 0 ? boxes[0] : undefined
        const measured = borderBox ? borderBox.blockSize : entry.target.getBoundingClientRect().height
        if (measured > 0 && ratchet(measured)) {
          observer.disconnect()
        }
      }
    })
    observer.observe(frame, { box: 'border-box' })
    return () => observer.disconnect()
  }, [enabled, isOpen, frame, isWebApp, interfaceNavHeight])
}

/** Ref pair for chrome elements that dismissal guards need to identify by DOM containment. */
export function useChromeNodeRef(): [MutableRefObject<HTMLElement | null>, (node: unknown) => void] {
  const nodeRef = useRef<HTMLElement | null>(null)
  const setNode = useCallback((node: unknown): void => {
    nodeRef.current = node instanceof HTMLElement ? node : null
  }, [])
  return [nodeRef, setNode]
}

export function getPercentSnapHeight(snapPoints?: ReadonlyArray<string | number> | null): string | undefined {
  const first = snapPoints?.[0]
  if (typeof first === 'number' && Number.isFinite(first)) {
    return `${first}dvh`
  }
  if (typeof first === 'string' && first.endsWith('%')) {
    const parsed = Number.parseFloat(first)
    if (Number.isFinite(parsed)) {
      return `${parsed}dvh`
    }
  }
  return undefined
}

/** Percent snap height rides INLINE style (Tamagui set forcedContentHeight as inline
 * height+minHeight): a base height prop compiles to a class that media-scoped consumer
 * classes would outrank. Merges over the consumer style so the snap point wins. */
export function getPercentFrameStyle({
  snapPointsMode,
  snapPoints,
  consumerStyle,
}: {
  snapPointsMode: string
  snapPoints?: ReadonlyArray<string | number> | null
  consumerStyle?: CSSProperties
}): CSSProperties | undefined {
  if (snapPointsMode !== 'percent') {
    return consumerStyle
  }
  const percentSnapHeight = getPercentSnapHeight(snapPoints)
  if (percentSnapHeight === undefined) {
    return consumerStyle
  }
  return { ...consumerStyle, height: percentSnapHeight, minHeight: percentSnapHeight }
}

export interface SheetHeightStyles {
  height?: string | number
  maxHeight?: string | number
}

/**
 * Sheet frame sizing, matching Tamagui Sheet's semantics per snap mode:
 * - `percent`: the first snap point fixes the frame height (viewport-relative).
 * - `fit` (default): the frame sizes to its content up to a viewport cap. Tamagui's fit
 *   implementation overrode any consumer height with its own measured height, so consumer height
 *   plumbing (`$md.$platform-web.height`, e.g. the token selector's `100vh`) must NOT stretch the
 *   frame — applying it literally turns content-fit sheets into full-screen ones.
 */
export function getSheetHeightStyles({
  snapPointsMode,
  snapPoints,
  isWebApp,
  interfaceNavHeight,
  mdMaxHeight,
}: {
  snapPointsMode: string
  snapPoints?: ReadonlyArray<string | number> | null
  isWebApp: boolean
  interfaceNavHeight: number
  mdMaxHeight?: string | number
}): SheetHeightStyles {
  if (snapPointsMode === 'percent') {
    const percentSnapHeight = getPercentSnapHeight(snapPoints)
    return {
      ...(percentSnapHeight !== undefined && { height: percentSnapHeight }),
      maxHeight: '100dvh',
    }
  }
  // The explicit `height: undefined` is load-bearing: it masks any consumer height spread onto the
  // frame earlier (consumers forward e.g. `height="100vh"` for fullScreen modals), which must not
  // win in fit mode.
  return {
    height: undefined,
    maxHeight: isWebApp ? `calc(100vh - ${interfaceNavHeight}px)` : (mdMaxHeight ?? '100dvh'),
  }
}

/**
 * Handle-initiated (plus frame-chrome on pointer devices) drag-to-dismiss for the bottom sheet.
 * The drag transform is written straight to the DOM node so pointer moves don't re-render React;
 * releasing below the dismiss threshold transitions the frame back into place.
 */
export function useSheetDrag({
  isOpen,
  isTouchDevice,
  onClose,
  frame,
}: {
  isOpen: boolean
  isTouchDevice: boolean
  onClose?: () => void
  /** Frame node as state (callback ref) — see useSheetFitHeightFreeze: a RefObject read inside
   * the effect misses a deferred mount (the node arrives without any dep changing), which left
   * drag-to-dismiss unattached on every deferred-mount open. */
  frame: HTMLDivElement | null
}): void {
  // Ref'd so a consumer re-render with an inline onClose cannot re-run the effect mid-drag
  // (which reset the drag transform under the finger, orphaned the window listeners, and let the
  // eventual pointerup call a stale closure).
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!isOpen || !frame) {
      return undefined
    }
    // Clear any inline drag/dismiss styles from a previous close so the frame is force-mounted
    // clean and the stylesheet's enter/exit rules take effect again.
    frame.style.transition = ''
    frame.style.transform = ''

    const onPointerDown = (event: PointerEvent): void => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return
      }
      const target = event.target instanceof HTMLElement ? event.target : null
      const fromHandle = Boolean(target?.closest('[data-sheet-handle]'))
      // Touch devices drag only from the handlebar so content scrolling stays untouched;
      // pointer devices may also drag from the frame chrome (not the scrollable content).
      if (!fromHandle && (isTouchDevice || Boolean(target?.closest('[data-sheet-content]')))) {
        return
      }

      isTouchDragActive = event.pointerType === 'touch'
      const startY = event.clientY
      let lastY = startY
      let lastTimestamp = performance.now()
      let velocity = 0
      let offset = 0
      frame.style.transition = 'none'

      const onPointerMove = (moveEvent: PointerEvent): void => {
        const now = performance.now()
        const deltaT = now - lastTimestamp
        if (deltaT > 0) {
          velocity = (moveEvent.clientY - lastY) / deltaT
        }
        lastY = moveEvent.clientY
        lastTimestamp = now
        offset = Math.max(0, moveEvent.clientY - startY)
        frame.style.transform = offset > 0 ? `translateY(${offset}px)` : ''
      }

      const endDrag = (dismiss: boolean): void => {
        removeActiveDragListeners?.()
        removeActiveDragListeners = undefined
        isTouchDragActive = false
        if (dismiss && onCloseRef.current) {
          // Slide out from the dragged position via inline styles (the frame stays mounted while
          // closed, so the inline transform must be driven off-screen rather than left in place;
          // the reopen effect above clears these).
          frame.style.transition = 'transform 200ms ease-in-out'
          frame.style.transform = 'translateY(100%)'
          onCloseRef.current()
          return
        }
        // Scoped to transform only — transitioning `all` flashes theme-token colors on theme toggle.
        frame.style.transition = 'transform 200ms ease-in-out'
        frame.style.transform = ''
      }

      const onPointerUp = (): void => {
        const dismissThreshold = Math.min(frame.offsetHeight * 0.4, 160)
        endDrag(offset > dismissThreshold || (velocity > 0.5 && offset > 24))
      }
      const onPointerCancel = (): void => endDrag(false)

      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
      window.addEventListener('pointercancel', onPointerCancel)
      removeActiveDragListeners = () => {
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
        window.removeEventListener('pointercancel', onPointerCancel)
      }
    }

    // Tracks the in-flight drag's window listeners so BOTH endDrag and the effect cleanup remove
    // them — an unmount/close mid-drag previously leaked all three.
    let removeActiveDragListeners: (() => void) | undefined
    let isTouchDragActive = false
    // Even under touch-action: none, Chromium turns a fast touch release into a fling and swallows
    // the next tap (~300ms) as "tap to stop fling" — no click, so the trigger can't reopen the sheet.
    // Consuming the drag's touchmove prevents the fling. Bound for the open lifetime, not per drag,
    // so it is already registered when the touchstart is hit-tested and the touchmoves stay cancelable.
    const onTouchMove = (event: TouchEvent): void => {
      if (isTouchDragActive && event.cancelable) {
        event.preventDefault()
      }
    }
    frame.addEventListener('pointerdown', onPointerDown)
    frame.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      frame.removeEventListener('pointerdown', onPointerDown)
      frame.removeEventListener('touchmove', onTouchMove)
      removeActiveDragListeners?.()
      removeActiveDragListeners = undefined
      isTouchDragActive = false
    }
  }, [isOpen, isTouchDevice, frame])
}
