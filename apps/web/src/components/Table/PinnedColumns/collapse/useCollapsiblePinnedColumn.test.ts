import { renderHook } from '@testing-library/react'
import { useCollapsiblePinnedColumn } from '~/components/Table/PinnedColumns/collapse/useCollapsiblePinnedColumn'
import {
  COLLAPSE_PROGRESS_VAR,
  DEFAULT_COLLAPSED_COLUMN_WIDTH,
  getCollapsiblePinnedColumnMeta,
  getPinnedColumnWidthCss,
} from '~/components/Table/PinnedColumns/collapse/utils'

describe('pinned column collapse geometry', () => {
  it('interpolates the width between the expanded and collapsed widths in CSS', () => {
    expect(getPinnedColumnWidthCss({ expandedWidth: 225, collapsedWidth: 72 })).toBe(
      `calc(225px - var(${COLLAPSE_PROGRESS_VAR}, 0) * 153px)`,
    )
  })

  it('paints the column meta against the collapse progress', () => {
    const widths = { expandedWidth: 190, collapsedWidth: DEFAULT_COLLAPSED_COLUMN_WIDTH }
    expect(getCollapsiblePinnedColumnMeta(widths)).toEqual({
      widthOverride: getPinnedColumnWidthCss(widths),
      trailingMarginCss: expect.stringContaining(COLLAPSE_PROGRESS_VAR),
    })
  })
})

describe('useCollapsiblePinnedColumn', () => {
  /** A root wrapping one scroll pane; jsdom computes no overflow or scroll geometry, so both are stubbed. */
  function renderScrollableRoot(): {
    root: HTMLElement
    scroller: HTMLElement
    scrollTo: (x: number) => Promise<void>
    progress: () => string
  } {
    const root = document.createElement('div')
    const scroller = document.createElement('div')
    root.appendChild(scroller)
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      (el) => ({ overflowX: el === scroller ? 'auto' : 'visible' }) as CSSStyleDeclaration,
    )
    document.body.appendChild(root)
    onTestFinished(() => {
      root.remove()
      vi.restoreAllMocks()
    })
    let scrollLeft = 0
    Object.defineProperties(scroller, {
      scrollLeft: { get: () => scrollLeft },
      scrollWidth: { value: 2000 },
      clientWidth: { value: 400 },
    })
    const scrollTo = async (x: number): Promise<void> => {
      scrollLeft = x
      scroller.dispatchEvent(new Event('scroll'))
      await new Promise(requestAnimationFrame)
    }
    renderHook(() =>
      useCollapsiblePinnedColumn({
        rootRef: { current: root },
        widths: { expandedWidth: 190, collapsedWidth: DEFAULT_COLLAPSED_COLUMN_WIDTH },
      }),
    )
    return { root, scroller, scrollTo, progress: () => root.style.getPropertyValue(COLLAPSE_PROGRESS_VAR) }
  }

  it('grows the column back on a scroll back left from anywhere in the table', async () => {
    const { scroller, scrollTo, progress } = renderScrollableRoot()

    scroller.dispatchEvent(new WheelEvent('wheel', { bubbles: true }))
    await scrollTo(300)
    expect(progress()).toBe('1.0000')

    // A drag starting well right of the collapsed column.
    scroller.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 300 }))
    await scrollTo(250)
    expect(progress()).toBe('0.5000')

    await scrollTo(280)
    expect(progress()).toBe('0.8000')
  })

  it('collapses on a side scroll button press, but not on a scroll with no input behind it', async () => {
    const { root, scrollTo, progress } = renderScrollableRoot()
    const scrollButton = document.createElement('div')
    scrollButton.setAttribute('data-table-scroll-button', '')
    root.appendChild(scrollButton)

    await scrollTo(150)
    expect(progress()).toBe('0.0000')

    await scrollTo(0)
    scrollButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await scrollTo(150)
    expect(progress()).toBe('1.0000')
  })
})
