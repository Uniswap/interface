import { renderHook } from '@testing-library/react'
import type { Input } from '@universe/mycelium'
import type { RefObject } from 'react'
import { useScrollInputIntoView } from '~/pages/Portfolio/components/hooks/useScrollInputIntoView'

const env = vi.hoisted(() => ({
  isMobileWeb: true,
  isSafari: false,
  isWebAndroid: true,
  isWebIOS: false,
}))

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isMobileWeb() {
      return env.isMobileWeb
    },
    get isSafari() {
      return env.isSafari
    },
    get isWebAndroid() {
      return env.isWebAndroid
    },
    get isWebIOS() {
      return env.isWebIOS
    },
  }
})

// Trust Wallet's Android in-app browser; `; wv)` is the token `isInAppBrowser()` keys on.
const IN_APP_BROWSER_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 13; SM-G991B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.230 Mobile Safari/537.36'
const CHROME_FOR_ANDROID_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'

// Mirrors the hook's private `KEYBOARD_INSET_PX`; it scrolls only on a shrink strictly greater.
const KEYBOARD_INSET_THRESHOLD_PX = 100
const KEYBOARD_HEIGHT_PX = 320

const SCROLL_OPTIONS = { block: 'center', inline: 'nearest', behavior: 'smooth' } as const

function setUserAgent(userAgent: string): void {
  // defineProperty, not assignment: `Navigator.userAgent` is a readonly accessor.
  Object.defineProperty(navigator, 'userAgent', { value: userAgent, configurable: true })
}

/**
 * jsdom ships no `window.visualViewport`. The stand-in is backed by a real `EventTarget` so the
 * hook's add/remove/dispatch go through genuine DOM event plumbing and only `height` is scripted.
 */
function installVisualViewport(): { shrinkBy: (px: number) => void; restoreHeight: () => void } {
  const events = new EventTarget()
  let height = window.innerHeight
  Object.defineProperty(window, 'visualViewport', {
    value: {
      get height() {
        return height
      },
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
      dispatchEvent: events.dispatchEvent.bind(events),
    },
    configurable: true,
  })
  return {
    shrinkBy(px) {
      height = window.innerHeight - px
      events.dispatchEvent(new Event('resize'))
    },
    restoreHeight() {
      height = window.innerHeight
      events.dispatchEvent(new Event('resize'))
    },
  }
}

const mountedInputs: HTMLElement[] = []

function createInput(): {
  ref: RefObject<Input | null>
  element: HTMLInputElement
  scrollIntoView: ReturnType<typeof vi.fn>
} {
  const element = document.createElement('input')
  document.body.appendChild(element)
  mountedInputs.push(element)

  // jsdom implements no `scrollIntoView`; stub it on the test-owned element, not the shared prototype.
  const scrollIntoView = vi.fn()
  element.scrollIntoView = scrollIntoView

  // SAFETY: `Input` is react-native's `TextInput` type, but the compat's web leg renders a real
  // `<input>`, so this ref holds a DOM element in production — hence the hook's `instanceof` narrow.
  const ref: RefObject<Input | null> = { current: element as unknown as Input }
  return { ref, element, scrollIntoView }
}

describe('useScrollInputIntoView', () => {
  const originalUserAgent = navigator.userAgent
  let viewport: ReturnType<typeof installVisualViewport>

  beforeEach(() => {
    Object.assign(env, { isMobileWeb: true, isSafari: false, isWebAndroid: true, isWebIOS: false })
    setUserAgent(IN_APP_BROWSER_USER_AGENT)
    viewport = installVisualViewport()
  })

  afterEach(() => {
    setUserAgent(originalUserAgent)
    Reflect.deleteProperty(window, 'visualViewport')
    mountedInputs.forEach((element) => element.remove())
    mountedInputs.length = 0
  })

  it('scrolls the focused field into view once the keyboard shrinks the visual viewport', () => {
    const input = createInput()
    renderHook(() => useScrollInputIntoView({ inputRef: input.ref, enabled: true }))

    input.element.focus()
    // Focus alone is not the trigger; the keyboard has not opened yet.
    expect(input.scrollIntoView).not.toHaveBeenCalled()

    viewport.shrinkBy(KEYBOARD_HEIGHT_PX)

    expect(input.scrollIntoView).toHaveBeenCalledWith(SCROLL_OPTIONS)
  })

  it('subscribes at mount when the field is already focused', () => {
    const input = createInput()
    input.element.focus()

    renderHook(() => useScrollInputIntoView({ inputRef: input.ref, enabled: true }))
    viewport.shrinkBy(KEYBOARD_HEIGHT_PX)

    expect(input.scrollIntoView).toHaveBeenCalledWith(SCROLL_OPTIONS)
  })

  it('ignores a shrink no larger than the keyboard threshold', () => {
    const input = createInput()
    renderHook(() => useScrollInputIntoView({ inputRef: input.ref, enabled: true }))

    input.element.focus()
    viewport.shrinkBy(KEYBOARD_INSET_THRESHOLD_PX)

    expect(input.scrollIntoView).not.toHaveBeenCalled()
  })

  it('stops responding to viewport resizes after blur', () => {
    const input = createInput()
    renderHook(() => useScrollInputIntoView({ inputRef: input.ref, enabled: true }))

    input.element.focus()
    viewport.shrinkBy(KEYBOARD_HEIGHT_PX)
    expect(input.scrollIntoView).toHaveBeenCalledTimes(1)

    viewport.restoreHeight()
    input.element.blur()
    viewport.shrinkBy(KEYBOARD_HEIGHT_PX)

    expect(input.scrollIntoView).toHaveBeenCalledTimes(1)
  })

  it('detaches its listeners on unmount', () => {
    const input = createInput()
    const { unmount } = renderHook(() => useScrollInputIntoView({ inputRef: input.ref, enabled: true }))

    unmount()
    input.element.focus()
    viewport.shrinkBy(KEYBOARD_HEIGHT_PX)

    expect(input.scrollIntoView).not.toHaveBeenCalled()
  })

  it('is a no-op when disabled', () => {
    const input = createInput()
    renderHook(() => useScrollInputIntoView({ inputRef: input.ref, enabled: false }))

    input.element.focus()
    viewport.shrinkBy(KEYBOARD_HEIGHT_PX)

    expect(input.scrollIntoView).not.toHaveBeenCalled()
  })

  it('is a no-op outside an in-app browser, keyed on the shared check', () => {
    setUserAgent(CHROME_FOR_ANDROID_USER_AGENT)
    const input = createInput()
    renderHook(() => useScrollInputIntoView({ inputRef: input.ref, enabled: true }))

    input.element.focus()
    viewport.shrinkBy(KEYBOARD_HEIGHT_PX)

    expect(input.scrollIntoView).not.toHaveBeenCalled()
  })

  it('is a no-op where visualViewport is unavailable', () => {
    Reflect.deleteProperty(window, 'visualViewport')
    const input = createInput()

    expect(() => renderHook(() => useScrollInputIntoView({ inputRef: input.ref, enabled: true }))).not.toThrow()

    input.element.focus()
    expect(input.scrollIntoView).not.toHaveBeenCalled()
  })
})
