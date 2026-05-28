import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type ScrollStore = typeof import('~/state/scroll/scrollStore')

let currentScrollY = 0
let pendingRafCallback: FrameRequestCallback | null = null

function flushRaf(): void {
  if (pendingRafCallback) {
    const cb = pendingRafCallback
    pendingRafCallback = null
    cb(performance.now())
  }
}

function setScrollY(y: number): void {
  currentScrollY = y
}

beforeEach(() => {
  currentScrollY = 0
  pendingRafCallback = null

  Object.defineProperty(window, 'scrollY', {
    get: () => currentScrollY,
    configurable: true,
  })

  // Capture RAF callback so tests can flush it manually (synchronous control).
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    pendingRafCallback = cb
    return 1
  })
  vi.stubGlobal(
    'cancelAnimationFrame',
    vi.fn(() => {
      pendingRafCallback = null
    }),
  )

  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.style.position = ''
})

async function loadStore(): Promise<ScrollStore> {
  return import('~/state/scroll/scrollStore')
}

describe('scrollStore — getScrollY', () => {
  it('returns 0 when window.scrollY is 0 at import time', async () => {
    setScrollY(0)
    const { getScrollY } = await loadStore()
    expect(getScrollY()).toBe(0)
  })

  it('reflects window.scrollY value captured at import time', async () => {
    setScrollY(250)
    const { getScrollY } = await loadStore()
    expect(getScrollY()).toBe(250)
  })
})

describe('scrollStore — subscribe', () => {
  it('registers a scroll listener on the first subscriber', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const { subscribe } = await loadStore()

    const unsub = subscribe(vi.fn())

    expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true })
    unsub()
  })

  it('does not add a second DOM listener for multiple subscribers', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const { subscribe } = await loadStore()

    const unsub1 = subscribe(vi.fn())
    const unsub2 = subscribe(vi.fn())

    // Should still be called exactly once
    expect(addSpy).toHaveBeenCalledTimes(1)

    unsub1()
    unsub2()
  })

  it('removes the DOM listener only when the last subscriber unsubscribes', async () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { subscribe } = await loadStore()

    const unsub1 = subscribe(vi.fn())
    const unsub2 = subscribe(vi.fn())

    unsub1()
    expect(removeSpy).not.toHaveBeenCalled()

    unsub2()
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
  })

  it('returns a no-op unsubscribe when called after already unsubscribed', async () => {
    const { subscribe } = await loadStore()

    const unsub = subscribe(vi.fn())
    unsub()
    // Should not throw
    expect(() => unsub()).not.toThrow()
  })

  it('snapshots window.scrollY when a listener subscribes', async () => {
    setScrollY(150)
    const { subscribe, getScrollY } = await loadStore()

    subscribe(vi.fn())

    expect(getScrollY()).toBe(150)
  })
})

describe('scrollStore — scroll event handling', () => {
  it('updates scrollY after a scroll event is flushed through RAF', async () => {
    const { subscribe, getScrollY } = await loadStore()
    const listener = vi.fn()

    subscribe(listener)

    setScrollY(300)
    window.dispatchEvent(new Event('scroll'))
    flushRaf()

    expect(getScrollY()).toBe(300)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('notifies all subscribers on scroll', async () => {
    const { subscribe } = await loadStore()
    const cb1 = vi.fn()
    const cb2 = vi.fn()

    subscribe(cb1)
    subscribe(cb2)

    setScrollY(100)
    window.dispatchEvent(new Event('scroll'))
    flushRaf()

    expect(cb1).toHaveBeenCalledTimes(1)
    expect(cb2).toHaveBeenCalledTimes(1)
  })

  it('debounces rapid scroll events — only one RAF callback per frame', async () => {
    const { subscribe } = await loadStore()
    const listener = vi.fn()

    subscribe(listener)

    setScrollY(50)
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('scroll'))
    flushRaf()

    // Only one listener call despite three scroll events
    expect(listener).toHaveBeenCalledTimes(1)
  })
})

describe('scrollStore — scroll lock handling', () => {
  it('preserves last known scrollY when body.position is "fixed" (ScrollLock active)', async () => {
    const { subscribe, getScrollY } = await loadStore()

    subscribe(vi.fn())

    // First scroll to establish a real position
    setScrollY(200)
    window.dispatchEvent(new Event('scroll'))
    flushRaf()
    expect(getScrollY()).toBe(200)

    // Simulate ScrollLock: body is fixed, window.scrollY resets to 0
    document.body.style.position = 'fixed'
    setScrollY(0)
    window.dispatchEvent(new Event('scroll'))
    flushRaf()

    // Store should still report the pre-lock value
    expect(getScrollY()).toBe(200)
  })

  it('resumes tracking scrollY once scroll lock is released', async () => {
    const { subscribe, getScrollY } = await loadStore()

    subscribe(vi.fn())

    setScrollY(200)
    window.dispatchEvent(new Event('scroll'))
    flushRaf()

    document.body.style.position = 'fixed'
    setScrollY(0)
    window.dispatchEvent(new Event('scroll'))
    flushRaf()

    // Release lock and scroll to a new position
    document.body.style.position = ''
    setScrollY(80)
    window.dispatchEvent(new Event('scroll'))
    flushRaf()

    expect(getScrollY()).toBe(80)
  })
})

describe('scrollStore — RAF cancellation on full unsubscribe', () => {
  it('cancels a pending RAF when the last subscriber unsubscribes mid-frame', async () => {
    const cancelSpy = vi.mocked(cancelAnimationFrame)
    const { subscribe } = await loadStore()

    const unsub = subscribe(vi.fn())

    // Trigger scroll to schedule a RAF without flushing it
    window.dispatchEvent(new Event('scroll'))
    // pendingRafCallback is now set but not yet called

    unsub()

    expect(cancelSpy).toHaveBeenCalled()
  })
})
