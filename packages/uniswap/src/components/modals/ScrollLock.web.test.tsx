import { cleanup, renderHook } from '@testing-library/react'
import { StrictMode } from 'react'

type ScrollLockModule = typeof import('uniswap/src/components/modals/ScrollLock.web')

const SCROLL_OFFSET_PX = 1234

// `initializeScrollWatcher` latches module-level `isInitialized`/`currentScrollY`, so each case
// needs its own module instance.
async function loadScrollLock(): Promise<ScrollLockModule> {
  vi.resetModules()
  return await import('uniswap/src/components/modals/ScrollLock.web')
}

function scrollPageTo(scrollY: number): void {
  Object.defineProperty(window, 'scrollY', { value: scrollY, writable: true, configurable: true })
  window.dispatchEvent(new Event('scroll'))
}

describe('ScrollLock.web', () => {
  afterEach(() => {
    // unmount before the `scrollTo` spy is restored, otherwise React's teardown reaches jsdom's
    // unimplemented `window.scrollTo`
    cleanup()
    vi.restoreAllMocks()
    document.body.style.position = ''
    document.body.style.top = ''
    scrollPageTo(0)
  })

  describe('useUpdateScrollLock', () => {
    it('restores the original offset exactly once when the modal closes', async () => {
      const { initializeScrollWatcher, useUpdateScrollLock } = await loadScrollLock()
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
      initializeScrollWatcher()
      scrollPageTo(SCROLL_OFFSET_PX)

      const { rerender } = renderHook(
        ({ isModalOpen }: { isModalOpen: boolean }) => useUpdateScrollLock({ isModalOpen }),
        { initialProps: { isModalOpen: true } },
      )

      expect(document.body.style.position).toBe('fixed')
      expect(document.body.style.top).toBe(`-${SCROLL_OFFSET_PX}px`)
      expect(scrollToSpy).not.toHaveBeenCalled()

      rerender({ isModalOpen: false })

      // React runs cleanup-then-setup on the transition; the bug fired a second `scrollTo(0, 0)`
      // from the setup pass, after the cleanup had already consumed the stored offset
      expect(scrollToSpy.mock.calls).toEqual([[0, SCROLL_OFFSET_PX]])
      expect(document.body.style.position).toBe('')
      expect(document.body.style.top).toBe('')
    })

    it('restores the original offset when the consumer unmounts while open', async () => {
      const { initializeScrollWatcher, useUpdateScrollLock } = await loadScrollLock()
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
      initializeScrollWatcher()
      scrollPageTo(SCROLL_OFFSET_PX)

      const { unmount } = renderHook(() => useUpdateScrollLock({ isModalOpen: true }))
      unmount()

      expect(scrollToSpy.mock.calls).toEqual([[0, SCROLL_OFFSET_PX]])
    })

    it('does not scroll on mount or on the open transition', async () => {
      const { initializeScrollWatcher, useUpdateScrollLock } = await loadScrollLock()
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
      initializeScrollWatcher()
      scrollPageTo(SCROLL_OFFSET_PX)

      const { rerender } = renderHook(
        ({ isModalOpen }: { isModalOpen: boolean }) => useUpdateScrollLock({ isModalOpen }),
        { initialProps: { isModalOpen: false } },
      )

      expect(scrollToSpy).not.toHaveBeenCalled()
      expect(document.body.style.position).toBe('')

      rerender({ isModalOpen: true })

      expect(scrollToSpy).not.toHaveBeenCalled()
      expect(document.body.style.position).toBe('fixed')
      expect(document.body.style.top).toBe(`-${SCROLL_OFFSET_PX}px`)
    })
    it('keeps the original offset under StrictMode double-invoked effects', async () => {
      const { initializeScrollWatcher, useUpdateScrollLock } = await loadScrollLock()
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
      initializeScrollWatcher()
      scrollPageTo(SCROLL_OFFSET_PX)

      const { rerender } = renderHook(
        ({ isModalOpen }: { isModalOpen: boolean }) => useUpdateScrollLock({ isModalOpen }),
        { initialProps: { isModalOpen: true }, wrapper: StrictMode },
      )

      // StrictMode runs lock -> unlock -> lock on mount; the re-lock must keep the offset, not 0
      expect(document.body.style.position).toBe('fixed')
      expect(document.body.style.top).toBe(`-${SCROLL_OFFSET_PX}px`)

      rerender({ isModalOpen: false })

      expect(scrollToSpy.mock.calls).toEqual([
        [0, SCROLL_OFFSET_PX],
        [0, SCROLL_OFFSET_PX],
      ])
      expect(document.body.style.position).toBe('')
    })
  })

  describe('updateScrollLock', () => {
    it('ignores a repeated unlock instead of scrolling to the top', async () => {
      const { initializeScrollWatcher, updateScrollLock } = await loadScrollLock()
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
      initializeScrollWatcher()
      scrollPageTo(SCROLL_OFFSET_PX)

      updateScrollLock({ isModalOpen: true })
      updateScrollLock({ isModalOpen: false })
      updateScrollLock({ isModalOpen: false })

      expect(scrollToSpy.mock.calls).toEqual([[0, SCROLL_OFFSET_PX]])
    })

    it('ignores an unlock that was never preceded by a lock', async () => {
      const { initializeScrollWatcher, updateScrollLock } = await loadScrollLock()
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
      initializeScrollWatcher()
      scrollPageTo(SCROLL_OFFSET_PX)

      updateScrollLock({ isModalOpen: false })

      expect(scrollToSpy).not.toHaveBeenCalled()
    })

    it('restores a fractional offset exactly', async () => {
      const { initializeScrollWatcher, updateScrollLock } = await loadScrollLock()
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
      initializeScrollWatcher()
      scrollPageTo(1234.5)

      updateScrollLock({ isModalOpen: true })
      updateScrollLock({ isModalOpen: false })

      expect(scrollToSpy.mock.calls).toEqual([[0, 1234.5]])
    })
  })
})
