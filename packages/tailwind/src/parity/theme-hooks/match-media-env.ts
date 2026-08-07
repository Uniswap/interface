/**
 * Evaluating `matchMedia` stand-in for the theme-hooks parity suite.
 *
 * The global vitest-setup mock is inert (`matches` always false), which would
 * make a media parity comparison trivially pass. This evaluator parses the
 * exact query grammar `ui/src/theme/media.ts` produces — single
 * `(max-width: Npx)` / `(max-height: Npx)` conditions — against a mutable
 * viewport, and notifies registered listeners on `setViewport`, so both hook
 * versions observe the same environment and react to the same changes.
 *
 * Tamagui captures `globalThis.matchMedia` when its media-driver module first
 * loads, so a test that renders the Tamagui `useMedia` must call
 * `installMatchMediaEvaluator()` BEFORE importing anything that pulls in
 * `ui/src` (dynamic `await import(...)` after the install call).
 */

type MediaListener = (event: { matches: boolean; media: string }) => void

interface MediaSubscription {
  query: string
  listeners: Set<MediaListener>
}

const viewport = { width: 1024, height: 768 }
const subscriptions = new Set<MediaSubscription>()

function evaluate(query: string): boolean {
  const maxWidth = /\(max-width:\s*([\d.]+)px\)/.exec(query)
  const maxHeight = /\(max-height:\s*([\d.]+)px\)/.exec(query)
  if (maxWidth === null && maxHeight === null) {
    // Unrelated queries (e.g. `(pointer:coarse)` from @tamagui/select at module
    // load) behave like the inert setup mock. The breakpoint queries this suite
    // compares are covered above; the "extremes" test proves they evaluate.
    return false
  }
  const widthOk = maxWidth === null || viewport.width <= Number(maxWidth[1])
  const heightOk = maxHeight === null || viewport.height <= Number(maxHeight[1])
  return widthOk && heightOk
}

function createMediaQueryList(query: string): MediaQueryList {
  const subscription: MediaSubscription = { query, listeners: new Set() }
  subscriptions.add(subscription)
  const mql = {
    get matches(): boolean {
      return evaluate(query)
    },
    media: query,
    onchange: null,
    addListener: (listener: MediaListener): void => {
      subscription.listeners.add(listener)
    },
    removeListener: (listener: MediaListener): void => {
      subscription.listeners.delete(listener)
    },
    addEventListener: (_type: string, listener: MediaListener): void => {
      subscription.listeners.add(listener)
    },
    removeEventListener: (_type: string, listener: MediaListener): void => {
      subscription.listeners.delete(listener)
    },
    dispatchEvent: (): boolean => false,
  }
  return mql as unknown as MediaQueryList
}

/** Replace the inert vitest-setup `matchMedia` mock with the evaluator. */
export function installMatchMediaEvaluator(): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string): MediaQueryList => createMediaQueryList(query),
  })
}

function defineWindowDimension(prop: 'innerWidth' | 'innerHeight', value: number): void {
  Object.defineProperty(window, prop, { writable: true, configurable: true, value })
}

/**
 * Resize the simulated viewport: updates `window.innerWidth`/`innerHeight`,
 * fires every registered media-query listener, and dispatches a window
 * `resize` event. Wrap calls in `act()` when hooks are mounted.
 */
export function setViewport(width: number, height: number): void {
  viewport.width = width
  viewport.height = height
  defineWindowDimension('innerWidth', width)
  defineWindowDimension('innerHeight', height)
  for (const { query, listeners } of subscriptions) {
    for (const listener of listeners) {
      listener({ matches: evaluate(query), media: query })
    }
  }
  window.dispatchEvent(new Event('resize'))
}
