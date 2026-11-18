import { render } from '@testing-library/react'
import { WebBottomSheet } from '@universe/mycelium/web-bottom-sheet-compat'
import { RemoveScroll } from 'ui/src/components/RemoveScroll/RemoveScroll'
import { afterEach, describe, expect, it } from 'vitest'

// jsdom's UA is desktop, so isMobileWeb is false: the default mode below is the
// hook-based html-overflow lock, and blockScrollEvents selects the event-based mode.

// Reset the root styles even when a test fails mid-way, so a single regression
// cannot leak `overflow`/`scrollbar-gutter` into later tests and cascade.
// DOM styles only: the pool's module-level refcount stays in sync because RTL's
// implicit auto-cleanup unmounts every render (running the effect cleanups)
// before this afterEach runs.
afterEach(() => {
  document.documentElement.style.overflow = ''
  document.documentElement.style.scrollbarGutter = ''
})

describe('RemoveScroll (web) — html-overflow lock mode', () => {
  it('locks html scroll while enabled and releases on unmount, restoring the previous overflow', () => {
    document.documentElement.style.overflow = 'scroll'
    const { unmount } = render(
      <RemoveScroll enabled>
        <span>body</span>
      </RemoveScroll>,
    )
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.documentElement.style.scrollbarGutter).toBe('stable')
    unmount()
    expect(document.documentElement.style.overflow).toBe('scroll')
  })

  it('releases the lock when enabled flips to false', () => {
    const { rerender, unmount } = render(
      <RemoveScroll enabled>
        <span>body</span>
      </RemoveScroll>,
    )
    expect(document.documentElement.style.overflow).toBe('hidden')
    rerender(
      <RemoveScroll enabled={false}>
        <span>body</span>
      </RemoveScroll>,
    )
    expect(document.documentElement.style.overflow).toBe('')
    unmount()
  })

  it('never engages the lock while disabled', () => {
    const { unmount } = render(
      <RemoveScroll>
        <span>body</span>
      </RemoveScroll>,
    )
    expect(document.documentElement.style.overflow).toBe('')
    unmount()
  })

  it('refcounts overlapping locks: releasing one of two keeps the page locked', () => {
    const first = render(
      <RemoveScroll enabled>
        <span>first</span>
      </RemoveScroll>,
    )
    const second = render(
      <RemoveScroll enabled>
        <span>second</span>
      </RemoveScroll>,
    )
    expect(document.documentElement.style.overflow).toBe('hidden')
    first.unmount()
    expect(document.documentElement.style.overflow).toBe('hidden')
    second.unmount()
    expect(document.documentElement.style.overflow).toBe('')
  })

  // INFRA-3559's exit-test analog: RemoveScroll (the legacy modal cluster's lock) and the compat
  // WebBottomSheet share ONE refcount pool, so closing the compat sheet first must not unlock the
  // page behind the still-open modal.
  it('shares its refcount pool with the compat WebBottomSheet (no early unlock)', () => {
    const modal = render(
      <RemoveScroll enabled>
        <span>legacy modal stand-in</span>
      </RemoveScroll>,
    )
    const sheet = render(
      <WebBottomSheet title="Sheet" isOpen>
        <span>compat sheet</span>
      </WebBottomSheet>,
    )
    expect(document.documentElement.style.overflow).toBe('hidden')
    // Close the compat sheet first: the modal's lock must persist.
    sheet.rerender(
      <WebBottomSheet title="Sheet" isOpen={false}>
        <span>compat sheet</span>
      </WebBottomSheet>,
    )
    expect(document.documentElement.style.overflow).toBe('hidden')
    modal.unmount()
    expect(document.documentElement.style.overflow).toBe('')
    sheet.unmount()
  })

  it('keeps children mounted (same DOM node) across enabled flips', () => {
    const { rerender, unmount } = render(
      <RemoveScroll enabled={false}>
        <span data-testid="stable-child">child</span>
      </RemoveScroll>,
    )
    const node = document.querySelector('[data-testid="stable-child"]')
    expect(node).not.toBeNull()
    rerender(
      <RemoveScroll enabled>
        <span data-testid="stable-child">child</span>
      </RemoveScroll>,
    )
    expect(document.querySelector('[data-testid="stable-child"]')).toBe(node)
    rerender(
      <RemoveScroll enabled={false}>
        <span data-testid="stable-child">child</span>
      </RemoveScroll>,
    )
    expect(document.querySelector('[data-testid="stable-child"]')).toBe(node)
    unmount()
  })
})

describe('RemoveScroll (web) — desktop blockScrollEvents mode', () => {
  it('renders bare children and no lock while disabled', () => {
    const { container, unmount } = render(
      <RemoveScroll blockScrollEvents enabled={false}>
        <span data-testid="bare-child">child</span>
      </RemoveScroll>,
    )
    expect((container.firstChild as HTMLElement).getAttribute('data-testid')).toBe('bare-child')
    expect(document.documentElement.style.overflow).toBe('')
    unmount()
  })

  it('supports the childless self-closing render via a display:contents wrapper (ContextMenu contract)', () => {
    const { container, unmount } = render(<RemoveScroll blockScrollEvents enabled />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).not.toBeNull()
    expect(wrapper.style.display).toBe('contents')
    unmount()
  })

  it('does not engage the html-overflow lock (event-based blocking only)', () => {
    const { unmount } = render(
      <RemoveScroll blockScrollEvents enabled>
        <span>child</span>
      </RemoveScroll>,
    )
    expect(document.documentElement.style.overflow).toBe('')
    unmount()
  })
})
